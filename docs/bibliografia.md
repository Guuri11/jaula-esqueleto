# Bibliografía

Las fuentes que sostienen la jaula, agrupadas por la pregunta que responden. Cada entrada dice **qué aporta al
proyecto**, no solo qué es. Los ADR las citan con su clave (`[B12]`).

Lectura mínima si tienes una tarde: [B1], [B3], [B4], [B6], [B12] y [B19].

## La tesis: verificar es el cuello de botella

- <a id="b1"></a>**[B1]** Andrej Karpathy. _Verifiability_ (2025). https://karpathy.bearblog.dev/verifiability/
  "Software 2.0 easily automates what you can verify." Una tarea es verificable si se puede reintentar, repetir muchas
  veces y juzgar automáticamente; una buena suite de tests cumple las tres. Origen del principio de
  [ADR-0001](adr/0001-optimizar-la-verificacion.md).
- <a id="b2"></a>**[B2]** Andrej Karpathy. _Sequoia AI Ascent 2026_ (2026).
  https://karpathy.bearblog.dev/sequoia-ascent-2026/
  La capacidad de un modelo en un dominio depende de la verificabilidad, la atención en el entrenamiento y la cobertura
  de datos. Argumento para elegir lenguaje ([ADR-0009](adr/0009-typescript-y-vite-plus.md)).
- <a id="b3"></a>**[B3]** Kent Beck. _Augmented Coding: Beyond the Vibes_ (2025).
  https://newsletter.kentbeck.com/p/augmented-coding-beyond-the-vibes
  Un B+Tree con IA: cuando Rust se atascó, la misma librería en Python contra los mismos tests y vuelta a Rust. El
  activo eran los tests; la implementación, intercambiable. También avisa: dos intentos murieron por complejidad
  acumulada.
- <a id="b4"></a>**[B4]** Chad Fowler. _Phoenix Architecture / Regenerative Software_ (serie, 2025–2026).
  https://chadfowler.com/regenerative-software/
  - _Evaluations Are the Real Codebase_: la implementación es una caché; lo que perdura son las evaluaciones.
    https://chadfowler.com/regenerative-software/3mb526js42k26/
  - _The Implementation Remembers_: el código maduro guarda lecciones nunca escritas; si regeneras sin capturarlas,
    se pierden. https://chadfowler.com/regenerative-software/3mobohx4fq22x/
  - _Compile to Architecture_: el software no debería "compilar" directamente a un framework.
    https://chadfowler.com/regenerative-software/3mgfsrk75ac2l/

  Distingue tests efímeros, evaluaciones duraderas y evaluaciones vivas; nuestra spec son solo las duraderas.

- <a id="b5"></a>**[B5]** Bertrand Meyer. _AI for software engineering: from probable to provable_ (2025).
  https://arxiv.org/abs/2511.23159
  Escribir specs (y prompts) es ingeniería de requisitos. Recordatorio de que la jaula no hace gratis el _qué_.
- <a id="b11"></a>**[B11]** Martin Kleppmann. _Prediction: AI will make formal verification go mainstream_ (2025).
  https://martin.kleppmann.com/2025/12/08/ai-formal-verification.html
  Si la IA escribe las pruebas, da igual que alucine: el verificador rechaza lo inválido. La dificultad pasa a ser
  escribir bien la especificación.

## Los límites: por qué "si pasa los tests, vale" no basta

- <a id="b6"></a>**[B6]** Ziqian Zhong et al. _ImpossibleBench: Measuring LLMs' Propensity of Exploiting Test Cases_
  (2025). https://arxiv.org/abs/2510.20270
  Tareas donde spec y tests se contradicen: los agentes "pasan" borrando tests, haciendo special-casing o sobrecargando
  operadores. Con tests de solo lectura dejan de editarlos sin perder rendimiento legítimo; ni eso ni ocultarlos frena
  el special-casing. Base de [ADR-0005](adr/0005-jaula-sellada-defensa-en-profundidad.md) y del holdout.
- <a id="b7"></a>**[B7]** _Are "Solved Issues" in SWE-bench Really Solved Correctly?_ (2025).
  https://arxiv.org/abs/2503.15223
  Con testing diferencial, el 29,6 % de los parches "plausibles" se comporta distinto del parche real.
- <a id="b8"></a>**[B8]** _SWE-Bench+: Enhanced Coding Benchmark for LLMs_ (2024). https://arxiv.org/abs/2410.06992
  Un 31 % de los parches aprobados eran sospechosos por tests débiles, incluso en suites curadas.
- <a id="b9"></a>**[B9]** _Do LLMs generate test oracles that capture the actual or the expected program behaviour?_
  (2024). https://arxiv.org/abs/2410.21136
  Los oráculos generados por LLM reflejan lo que el programa _hace_, no lo que _debería_ hacer. Por eso el oráculo es
  humano ([ADR-0002](adr/0002-htdf-frontera-humano-ia.md)).
- <a id="b10"></a>**[B10]** Birgitta Böckeler. _Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl_
  (2025). https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html
  Specs en prosa tediosas de revisar, agentes que las ignoran, resultados distintos en cada generación, y un aire a
  Model-Driven Development. Motivo de [ADR-0004](adr/0004-formas-de-spec-ejecutable.md).

## Arquitectura: núcleo puro, cáscara fina

- <a id="b12"></a>**[B12]** Jérémie Chassaing. _Functional Event Sourcing Decider_ (2021).
  https://thinkbeforecoding.com/post/2021/12/17/functional-event-sourcing-decider
  `decide: Command → State → Event list` y `evolve: State → Event → State`. Es el patrón del arnés
  (`#jaula/arnes`) y de la plantilla `--decider`.
- <a id="b13"></a>**[B13]** Gary Bernhardt. _Functional Core, Imperative Shell_ (2012).
  https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell
  Las decisiones en un núcleo funcional; el IO en una cáscara fina.
- <a id="b14"></a>**[B14]** James Shore. _Testing Without Mocks: A Pattern Language_ (A-Frame Architecture, Nullables).
  https://www.jamesshore.com/v2/projects/nullables/testing-without-mocks
  Los tests con mocks especifican el _cómo_ y congelan la implementación. Por eso la spec no usa mocks.
- <a id="b15"></a>**[B15]** James Bornholt et al. _Using Lightweight Formal Methods to Validate a Key-Value Storage
  Node in Amazon S3_ (SOSP 2021). https://jamesbornholt.com/papers/shardstore-sosp21.pdf
  Modelos ejecutables de ~1 % del tamaño del código (el modelo de un LSM-tree es un hash map) comparados con la
  implementación mediante property-based testing. Origen del "modelo ingenuo" de nuestras specs.
- <a id="b16"></a>**[B16]** _Cedar: A New Language for Expressive, Fast, Safe, and Analyzable Authorization_ (2024).
  https://arxiv.org/abs/2407.01688
  Modelo en Lean con pruebas, producción en Rust, testing diferencial entre ambos: spec y lenguaje de implementación
  separados.
- <a id="b17"></a>**[B17]** _A benchmark for vericoding: formally verified program synthesis_ (2025).
  https://arxiv.org/abs/2509.22908
  LLMs sin ajustar verifican la mayoría de specs en Dafny: la prueba formal empieza a ser asequible para núcleos
  críticos.
- <a id="b18"></a>**[B18]** Michael Nygard. _Documenting Architecture Decisions_ (2011).
  https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
  El formato de estos ADR.

## HtDF y specs que entiende un humano

- <a id="b19"></a>**[B19]** Matthias Felleisen, Robert Bruce Findler, Matthew Flatt, Shriram Krishnamurthi. _How to
  Design Programs_, 2.ª ed. (2018). https://htdp.org — y la receta _How to Design Functions_ (HtDF):
  https://docs.racket-lang.org/htdf/
  Datos → firma, propósito y stub → ejemplos → plantilla → código → tests. Los tres primeros pasos son el _qué_ (tuyos),
  los tres últimos el _cómo_ (del agente). Curiosidad: el ejemplo oficial dice que 86 °F son 30 °C y el test comprueba
  32; la spec también se equivoca, y un chequeo determinista lo destapa.
- <a id="b20"></a>**[B20]** _LLM-based Test-driven Interactive Code Generation: User Study and Empirical Evaluation_
  (TiCoder, Microsoft, 2024). https://arxiv.org/abs/2404.10100
  Aclarar la intención con tests sube mucho la precisión en pocas interacciones y baja la carga cognitiva.
- <a id="b21"></a>**[B21]** Google (2026). Generación de tests guiada por pre y postcondiciones.
  https://arxiv.org/abs/2608.17177
  Pedir al agente que escriba la especificación antes de los tests detecta más bugs reales.
- <a id="b23"></a>**[B23]** Kiro. _Property-based testing_ (2025). https://kiro.dev/blog/property-based-testing/
  Las herramientas de spec en prosa se mueven hacia specs ejecutables; ante un fallo dejan elegir qué arreglar: código,
  spec o test.
- <a id="b24"></a>**[B24]** Anthropic. _Property-based testing con agentes_ (2026).
  https://www.anthropic.com/research/property-based-testing
  Un agente encuentra bugs reales en librerías como NumPy, pero a veces solo el mantenedor sabe cuál es la propiedad
  correcta: la propiedad es una decisión humana.

## Endurecer la spec

- <a id="b22"></a>**[B22]** John C. Knight, Nancy G. Leveson. _An Experimental Evaluation of the Assumption of
  Independence in Multiversion Programming_ (IEEE TSE, 1986).
  Versiones "independientes" fallan de forma correlacionada. Lo vimos en directo: tres candidatos del mismo modelo
  coincidían en el error ([ADR-0007](adr/0007-endurecer-la-spec.md)).
- <a id="b25"></a>**[B25]** _CodeT: Code Generation with Generated Tests_ (2022). https://arxiv.org/abs/2207.10397
  El acuerdo entre muestras como señal. Base de la sonda de ambigüedad (que usa el _desacuerdo_).
- <a id="b26"></a>**[B26]** _Mutation-Guided LLM-based Test Generation at Meta_ (ACH, 2025).
  https://arxiv.org/abs/2501.12862
  Mutación semántica con LLM en producción: el precedente del abogado del diablo.
- <a id="b27"></a>**[B27]** _TDAD_ (2026). https://arxiv.org/abs/2603.08806
  Combina tests visibles y ocultos para agentes, y aplica la misma idea a los prompts de los agentes.
- <a id="b28"></a>**[B28]** Stryker Mutator. https://stryker-mutator.io — mutation testing para JS/TS (`pnpm mutacion`).
- <a id="b29"></a>**[B29]** fast-check. https://fast-check.dev — property-based testing en TypeScript, con shrinking
  hasta el contraejemplo mínimo (así salió `cantidad: 5e-324`).

## Lenguaje, determinismo y frameworks

- <a id="b30"></a>**[B30]** _Type-Constrained Code Generation with Language Models_ (PLDI 2025).
  https://arxiv.org/abs/2504.09246
  El 94 % de los errores de compilación del código generado por LLM son de tipos: los tipos son un verificador gratis.
- <a id="b31"></a>**[B31]** Thinking Machines. _Defeating Nondeterminism in LLM Inference_ (2025).
  https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/
  1000 respuestas a temperatura 0 dieron 80 distintas. El determinismo no te lo da el modelo; te lo da el artefacto.
- <a id="b32"></a>**[B32]** Armin Ronacher. _Agentic Coding Recommendations_ (2025).
  https://lucumr.pocoo.org/2025/6/12/agentic-coding/
  Lenguajes simples y bucles rápidos para agentes; la magia en tiempo de ejecución y los arranques lentos penalizan.
- <a id="b33"></a>**[B33]** José Valim. _Why Elixir is the best language for AI_ (2025).
  https://dashbit.co/blog/why-elixir-best-language-for-ai
  Inmutabilidad, doctests y estabilidad de API como ventaja para modelos.
- <a id="b34"></a>**[B34]** GitHub. _Why AI is pushing developers toward typed languages_ (2025).
  https://github.blog/ai-and-ml/llms/why-ai-is-pushing-developers-toward-typed-languages/
- <a id="b35"></a>**[B35]** InfoQ. _AI reshapes language choice_ (2026).
  https://www.infoq.com/news/2026/03/ai-reshapes-language-choice/
  El "convenience loop": los lenguajes con más datos de entrenamiento atraen más uso, y viceversa.
- <a id="b36"></a>**[B36]** _GitChameleon 2.0_ (2025). https://arxiv.org/abs/2507.12367
  Con código atado a versiones concretas de librerías, los mejores modelos rondan el 50 %: la estabilidad de API
  importa.
- <a id="b37"></a>**[B37]** Laravel Boost. https://laravel.com/ai/boost
  Frameworks que se adaptan a agentes: documentación por versión y guías para el modelo.

## La IA como fabricante de herramientas

- <a id="b38"></a>**[B38]** _PAL: Program-aided Language Models_ (2022). https://arxiv.org/abs/2211.10435
  El modelo escribe el programa; el intérprete calcula.
- <a id="b39"></a>**[B39]** _Large Language Models as Tool Makers_ (LATM, 2023). https://arxiv.org/abs/2305.17126
  Un modelo caro fabrica herramientas y uno barato las usa: una "caché funcional" para toda una clase de peticiones.
- <a id="b40"></a>**[B40]** _Voyager: An Open-Ended Embodied Agent with Large Language Models_ (2023).
  https://arxiv.org/abs/2305.16291
  Una biblioteca de skills hechas de código ejecutable que crece con el uso.
- <a id="b41"></a>**[B41]** Anthropic. _Equipping agents for the real world with Agent Skills_ (2025).
  https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
  Algunas tareas necesitan la fiabilidad determinista que solo da el código. Formato abierto:
  https://agentskills.io/specification
- <a id="b42"></a>**[B42]** Anthropic. _Code execution with MCP_ (2025).
  https://www.anthropic.com/engineering/code-execution-with-mcp
  Agentes que guardan el código que les funciona en `./skills/` con un `SKILL.md`.
- <a id="b43"></a>**[B43]** Armin Ronacher. _Tools: Code Is All You Need_ (2025). https://lucumr.pocoo.org/2025/7/3/tools/
  Revisa la fórmula, no cada resultado.
- <a id="b44"></a>**[B44]** Cloudflare. _Code Mode_ (2025). https://blog.cloudflare.com/code-mode/
  Los modelos escriben código mejor de lo que llaman herramientas.
- <a id="b45"></a>**[B45]** Simon Willison. _Vibe engineering_ (2025). https://simonwillison.net/2025/Oct/7/vibe-engineering/
  Usar agentes con disciplina de ingeniería: tests, revisión, responsabilidad.

## Herramientas del esqueleto

- <a id="b46"></a>**[B46]** Vite+ (`vp`: Vitest, Oxlint, Oxfmt, tsgo). https://viteplus.dev
- <a id="b47"></a>**[B47]** pi, agente de código extensible. https://pi.dev · https://github.com/earendil-works/pi
- <a id="b48"></a>**[B48]** Claude Code: hooks y permisos. https://code.claude.com/docs/en/hooks ·
  https://code.claude.com/docs/en/permissions

[B1]: #b1
[B3]: #b3
[B4]: #b4
[B6]: #b6
[B12]: #b12
[B19]: #b19
