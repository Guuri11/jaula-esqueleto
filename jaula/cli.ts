// CLI de la jaula:  pnpm jaula <comando>   (o: node jaula/cli.ts <comando>)
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
  lstatSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import fc from "fast-check";
import { lanzarAgente } from "./lib/agentes.ts";
import { arbitrar } from "./lib/arbitro.ts";
import { buscarRaiz, type Config, LOCK, leerConfig } from "./lib/config.ts";
import { diferencias, huellas } from "./lib/protegidos.ts";

const raiz = buscarRaiz(process.cwd());
const config = leerConfig(raiz);
const [comando, ...args] = process.argv.slice(2);

const AYUDA = `Uso: pnpm jaula <comando>

  Humano
    sellar                       sella la jaula tras revisar un cambio (jaula.lock)
    nuevo <modulo> [--decider]   crea spec/<modulo>/ y el stub del núcleo
    configurar                   regenera la configuración de pi, Claude Code e imports

  Verificación
    verificar                    ¿la jaula coincide con lo sellado?
    arbitro [--completo] [mod…]  integridad + (check) + spec
    probar <modulo> <fichero>    ejecuta spec/<modulo> contra otra implementación

  Endurecer la spec
    abogado <modulo> [fichero]   un agente intenta colar una implementación tramposa
    candidatos <modulo> [n]      N agentes aislados implementan el módulo solo con la spec
    sonda <modulo> [carpeta]     entrada mínima donde core/ y los candidatos discrepan
`;

const modulos = () =>
  existsSync(join(raiz, config.spec))
    ? readdirSync(join(raiz, config.spec), { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
    : [];

function exigirModulo(m: string | undefined): string {
  if (!m || !modulos().includes(m)) {
    console.error(`Módulo desconocido "${m ?? ""}". Módulos con spec: ${modulos().join(", ") || "(ninguno)"}`);
    process.exit(2);
  }
  return m;
}

function probar(modulo: string, fichero: string) {
  return spawnSync(config.comandos.test[0], [...config.comandos.test.slice(1), `${config.spec}/${modulo}`], {
    cwd: raiz,
    env: { ...process.env, JAULA_SUSTITUIR: `${modulo}=${resolve(raiz, fichero)}` },
    encoding: "utf8",
  });
}

const ultimas = (texto: string, n = 25) => `  ${texto.split("\n").slice(-n).join("\n  ")}`;

const comandos: Record<string, () => Promise<void> | void> = {
  sellar() {
    const lock = huellas(raiz, config);
    writeFileSync(join(raiz, LOCK), `${JSON.stringify(lock, null, 2)}\n`);
    console.log(`🔒 Jaula sellada: ${Object.keys(lock).length} ficheros en ${LOCK}`);
  },

  verificar() {
    const fallo = diferencias(raiz, config);
    if (fallo.length > 0) {
      console.error(`✗ La jaula no coincide con ${LOCK}:\n  ${fallo.join("\n  ")}`);
      console.error("  Si el cambio es tuyo y lo has revisado: pnpm jaula sellar");
      process.exit(1);
    }
    console.log(`🔒 Jaula íntegra (${Object.keys(huellas(raiz, config)).length} ficheros)`);
  },

  async arbitro() {
    const completo = args.includes("--completo");
    const mods = args.filter((a) => !a.startsWith("--"));
    const r = await arbitrar(raiz, config, { completo, modulos: mods.length > 0 ? mods : ["*"] });
    if (!r.ok) {
      console.error(`✗ Árbitro en rojo (${r.paso})\n${r.salida}`);
      process.exit(1);
    }
    console.log(`✓ Árbitro en verde: integridad · ${r.resumen}`);
  },

  probar() {
    const modulo = exigirModulo(args[0]);
    if (!args[1] || !existsSync(resolve(raiz, args[1]))) {
      console.error("Uso: pnpm jaula probar <modulo> <fichero>");
      process.exit(2);
    }
    const r = probar(modulo, args[1]);
    process.stdout.write(r.stdout ?? "");
    process.stderr.write(r.stderr ?? "");
    process.exit(r.status ?? 1);
  },

  async abogado() {
    const modulo = exigirModulo(args[0]);
    let fichero = args[1];
    if (!fichero) {
      fichero = `.abogado/${modulo}.ts`;
      rmSync(join(raiz, fichero), { force: true });
      mkdirSync(join(raiz, ".abogado"), { recursive: true });
      process.stdout.write(`😈 El abogado (${config.agenteHeadless}) escribe ${fichero} `);
      const { respuesta } = await lanzarAgente(
        raiz,
        config.agenteHeadless,
        "abogado",
        fichero,
        [
          `Eres el abogado del diablo de la jaula. Lee ${config.spec}/${modulo}/ y jaula/arnes/.`,
          `Escribe en ${fichero} la implementación MÁS TRAMPOSA que pase esos tests sin implementar de verdad`,
          "el propósito: hardcodea los ejemplos, haz special-casing, devuelve constantes, explota huecos.",
          `Exporta lo que declara la firma de la spec. No puedes leer ${config.nucleo}/.`,
          `Pruébate con: node jaula/cli.ts probar ${modulo} ${fichero}`,
        ].join(" "),
      );
      console.log();
      if (!existsSync(join(raiz, fichero))) {
        console.log(`✗ El abogado no escribió ${fichero}. Respondió:\n${ultimas(respuesta)}`);
        process.exit(2);
      }
    }
    if (probar(modulo, fichero).status === 0) {
      console.log(`🕳️  La jaula tiene un agujero: ${fichero} pasa ${config.spec}/${modulo} siendo una trampa.`);
      console.log("   Añade un ejemplo o una propiedad que lo cace, y vuelve a sellar.");
      process.exit(1);
    }
    console.log(`✅ El abogado no cabe: ${config.spec}/${modulo} rechaza ${fichero}.`);
  },

  async candidatos() {
    const modulo = exigirModulo(args[0]);
    const n = Number(args[1] ?? 3);
    rmSync(join(raiz, ".candidatos", modulo), { recursive: true, force: true });
    mkdirSync(join(raiz, ".candidatos", modulo), { recursive: true });
    const destinos = Array.from({ length: n }, (_, i) => `.candidatos/${modulo}/c${i + 1}.ts`);
    process.stdout.write(`🧪 ${n} candidatos (${config.agenteHeadless}) en paralelo `);
    const resultados = await Promise.all(
      destinos.map((destino) =>
        lanzarAgente(
          raiz,
          config.agenteHeadless,
          "candidato",
          destino,
          [
            `Implementa el módulo "${modulo}" leyendo SOLO ${config.spec}/${modulo}/ y jaula/arnes/.`,
            `Escribe la implementación completa en ${destino}, exportando lo que declara la firma de la spec.`,
            `Comprueba tu trabajo con: node jaula/cli.ts probar ${modulo} ${destino}`,
            "Donde la spec no diga nada, decide tú como te parezca más razonable.",
            "Si la spec se contradice, no escribas nada y explica la contradicción con un caso concreto.",
          ].join(" "),
        ),
      ),
    );
    console.log();
    let validos = 0;
    resultados.forEach(({ respuesta }, i) => {
      const destino = destinos[i];
      const existe = existsSync(join(raiz, destino));
      if (existe && probar(modulo, destino).status === 0) {
        validos++;
        console.log(`✓ ${destino}`);
      } else {
        console.log(
          `✗ ${destino}: ${existe ? "no pasa la spec" : "no se escribió"}. Respondió:\n${ultimas(respuesta)}\n`,
        );
      }
    });
    console.log(validos > 0 ? `Siguiente: pnpm jaula sonda ${modulo}` : "Ningún candidato válido: revisa la spec.");
    process.exit(validos === n ? 0 : 1);
  },

  async sonda() {
    const modulo = exigirModulo(args[0]);
    const ficheroSonda = join(raiz, config.spec, modulo, "sonda.ts");
    if (!existsSync(ficheroSonda)) {
      console.error(`Falta ${config.spec}/${modulo}/sonda.ts (exporta { sonda: { exportacion, entrada, ejecutar } })`);
      process.exit(2);
    }
    type Sonda = {
      exportacion: string;
      entrada: fc.Arbitrary<unknown>;
      ejecutar: (impl: unknown, e: never) => unknown;
    };
    const { sonda } = (await import(pathToFileURL(ficheroSonda).href)) as { sonda: Sonda };
    const dir = resolve(raiz, args[1] ?? `.candidatos/${modulo}`);
    const nucleo = join(raiz, config.nucleo, `${modulo}.ts`);
    // core/ entra siempre: los candidatos de un mismo modelo tienden a decidir igual entre ellos.
    const ficheros = [
      ...(existsSync(nucleo) ? [{ nombre: config.nucleo, ruta: nucleo }] : []),
      ...(existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".ts")) : []).map((f) => ({
        nombre: f,
        ruta: join(dir, f),
      })),
    ];
    if (ficheros.length < 2) {
      console.error(`Necesito al menos 2 implementaciones. Genera candidatos con: pnpm jaula candidatos ${modulo}`);
      process.exit(2);
    }
    const impls = await Promise.all(
      ficheros.map(async ({ nombre, ruta }) => ({
        nombre,
        impl: ((await import(pathToFileURL(ruta).href)) as Record<string, unknown>)[sonda.exportacion],
      })),
    );
    const salida = (impl: unknown, entrada: unknown) => {
      try {
        return JSON.stringify(sonda.ejecutar(impl, entrada as never));
      } catch (e) {
        return `💥 ${e instanceof Error ? e.message : String(e)}`;
      }
    };
    const r = fc.check(
      fc.property(sonda.entrada, (e) => new Set(impls.map(({ impl }) => salida(impl, e))).size === 1),
      { numRuns: 2000 },
    );
    if (!r.failed || !r.counterexample) {
      console.log(`✅ ${impls.length} implementaciones coinciden en ${r.numRuns} entradas aleatorias.`);
      console.log("   (Coincidir no es acertar: solo significa que no han pisado un hueco de la spec.)");
      return;
    }
    const [entrada] = r.counterexample;
    console.log(`❓ La spec es ambigua. Entrada mínima donde discrepan:\n\n   ${JSON.stringify(entrada)}\n`);
    for (const { nombre, impl } of impls) console.log(`   ${nombre.padEnd(10)} → ${salida(impl, entrada)}`);
    console.log("\nDecide cuál es la salida correcta, añádela como ejemplo a la spec y vuelve a sellar.");
    process.exit(1);
  },

  nuevo() {
    const modulo = args[0];
    if (!modulo || !/^[a-z][a-z0-9-]*$/.test(modulo)) {
      console.error("Uso: pnpm jaula nuevo <modulo-en-kebab-case> [--decider]");
      process.exit(2);
    }
    const dir = join(raiz, config.spec, modulo);
    if (existsSync(dir)) {
      console.error(`Ya existe ${config.spec}/${modulo}/`);
      process.exit(2);
    }
    const plantilla = args.includes("--decider") ? "decider" : "funcion";
    const origen = join(import.meta.dirname, "plantillas", plantilla);
    const nombre = modulo.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
    const relspec = relative(join(raiz, config.nucleo), join(raiz, config.spec)).split("\\").join("/");
    const sustituir = (s: string) =>
      s.replaceAll("__relspec__", relspec).replaceAll("__modulo__", modulo).replaceAll("__nombre__", nombre);
    mkdirSync(dir, { recursive: true });
    for (const f of readdirSync(origen)) {
      const texto = sustituir(readFileSync(join(origen, f), "utf8"));
      const destino = f === "nucleo.ts" ? join(raiz, config.nucleo, `${modulo}.ts`) : join(dir, sustituir(f));
      mkdirSync(dirname(destino), { recursive: true });
      writeFileSync(destino, texto);
      console.log(`+ ${relative(raiz, destino)}`);
    }
    console.log(`\nRellena la spec (HtDF: datos, firma y propósito, ejemplos, propiedades) y sella: pnpm jaula sellar`);
  },

  configurar() {
    configurar(raiz, config);
  },
};

/** Regenera lo que depende de jaula.config.json: imports, pi y Claude Code. Idempotente. */
function configurar(raiz: string, config: Config) {
  const json = (f: string) =>
    existsSync(join(raiz, f)) ? (JSON.parse(readFileSync(join(raiz, f), "utf8")) as Record<string, unknown>) : {};
  const escribir = (f: string, datos: unknown) => {
    mkdirSync(dirname(join(raiz, f)), { recursive: true });
    writeFileSync(join(raiz, f), `${JSON.stringify(datos, null, 2)}\n`);
    console.log(`✎ ${f}`);
  };
  const enlazar = (enlace: string, objetivo: string) => {
    const ruta = join(raiz, enlace);
    mkdirSync(dirname(ruta), { recursive: true });
    if (existsSync(ruta) || lstatSync(ruta, { throwIfNoEntry: false })) rmSync(ruta, { recursive: true, force: true });
    symlinkSync(relative(dirname(ruta), join(raiz, objetivo)), ruta);
    console.log(`↪ ${enlace} → ${objetivo}`);
  };

  // 1. Imports: la spec importa el núcleo como #nucleo/<modulo>.ts y el arnés como #jaula/arnes.
  const pkg = json("package.json");
  pkg.imports = { "#jaula/arnes": "./jaula/arnes/index.ts", "#nucleo/*": `./${config.nucleo}/*` };
  escribir("package.json", pkg);

  // 2. pi: la carpeta jaula/ es un paquete de pi local (extensión, skill forja, prompts).
  const pi = json(".pi/settings.json");
  const paquetes = ((pi.packages as unknown[] | undefined) ?? []).filter((p) => p !== "../jaula");
  pi.packages = [...paquetes, "../jaula"];
  escribir(".pi/settings.json", pi);

  // 3. Claude Code: permisos deny sobre la jaula + hooks del candado y del árbitro.
  const claude = json(".claude/settings.json") as {
    permissions?: { deny?: string[]; [k: string]: unknown };
    hooks?: Record<string, unknown>;
  };
  const deny = config.protegidos.map((p) => (p.endsWith("/") ? `Edit(/${p}**)` : `Edit(/${p})`));
  const previos = (claude.permissions?.deny ?? []).filter((r) => !r.startsWith("Edit(/"));
  claude.permissions = { ...claude.permissions, deny: [...previos, ...deny] };
  const hook = (evento: string) => ({
    type: "command",
    command: `node "$CLAUDE_PROJECT_DIR/jaula/claude/hook.ts" ${evento}`,
  });
  claude.hooks = {
    ...claude.hooks,
    PreToolUse: [{ matcher: "Bash|Edit|Write|MultiEdit|NotebookEdit|Read|Grep|Glob", hooks: [hook("pre")] }],
    UserPromptSubmit: [{ hooks: [hook("prompt")] }],
    Stop: [{ hooks: [hook("stop")] }],
  };
  escribir(".claude/settings.json", claude);
  enlazar(".claude/skills/forja", "jaula/skills/forja");
  for (const p of readdirSync(join(raiz, "jaula", "prompts"))) enlazar(`.claude/commands/${p}`, `jaula/prompts/${p}`);
  enlazar("CLAUDE.md", "AGENTS.md");
  console.log("\nRevisa los cambios y sella: pnpm jaula sellar");
}

const accion = comandos[comando ?? ""];
if (!accion) {
  console.log(AYUDA);
  process.exit(comando ? 2 : 0);
}
await accion();
