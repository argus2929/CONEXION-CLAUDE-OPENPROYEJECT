// Reescribe títulos y descripciones a lenguaje de negocio (qué se hizo / qué se logró).
//   node --use-system-ca src/rewrite-no-tecnico.js
try { process.loadEnvFile('.env'); } catch {}

import { actualizarCampos } from './openproject.js';

// Solo descripción (mantienen su título).
const DESCRIPCIONES = [
  {
    id: 1037,
    descripcion:
      'Se identificaron y documentaron las necesidades del módulo de Clima Laboral: qué se quiere medir, cómo, para quién y con qué resultados.\n\n' +
      '**Lo que se logró:** quedó claro que el sistema debe medir el clima de forma totalmente anónima, entregar un resultado fácil de entender (de 0 a 100), desglosado por toda la organización, y permitir dar seguimiento a las acciones de mejora.\n\n✅ Completado.',
  },
  {
    id: 1038,
    descripcion:
      'Se definió todo lo que el módulo debe hacer, de principio a fin.\n\n' +
      '**Lo que se logró:** quedó definido el flujo completo — configurar la encuesta, aplicarla de forma anónima, calcular los resultados, mostrarlos en tableros y generar planes de mejora — además de qué información puede ver cada persona según su puesto.\n\n✅ Completado.',
  },
  {
    id: 1151,
    descripcion:
      'Se construyó el módulo completo de Clima Laboral, listo para usarse.\n\n' +
      '**Lo que se logró:** un sistema que permite crear y publicar la encuesta, recoger las respuestas de forma totalmente anónima, calcular el clima de la organización y mostrar los resultados con planes de mejora automáticos. Quedó al ~85 %, operativo y listo para el próximo año.\n\n✅',
  },
  {
    id: 1150,
    descripcion:
      'Se construyeron los tableros para consultar los resultados de un vistazo.\n\n' +
      '**Lo que se logró:**\n' +
      '- Un resumen general con los indicadores principales.\n' +
      '- Una vista ejecutiva con mapa de calor y mapa de México por región.\n' +
      '- Gráficas comparativas y rankings de las mejores y peores áreas.\n' +
      '- Un tablero de participación en vivo.\n\n' +
      'Además, el resultado del clima ya aparece en la pantalla de inicio de Capital Humano.\n\n✅',
  },
];

// Renombrar título + reescribir descripción (los 10 "módulos").
const MODULOS = [
  {
    id: 1153,
    subject: 'Configuración y aplicación de encuestas',
    descripcion:
      'Permite crear la encuesta de clima, definir sus preguntas y los temas a evaluar, y controlar su ciclo: abrirla, cerrarla y abrir un nuevo año conservando el historial. Las preguntas se administran en un solo lugar y se aplican a todas las áreas por igual.\n\n✅ Terminado.',
  },
  {
    id: 1154,
    subject: 'Anonimato garantizado de los colaboradores',
    descripcion:
      'El sistema protege la identidad de quien responde: nunca se puede saber qué contestó una persona en particular. Los resultados de grupos muy pequeños se ocultan para que nadie pueda deducir respuestas individuales y no se guarda ningún dato personal. Esto da confianza para responder con honestidad.\n\n✅ Terminado.',
  },
  {
    id: 1155,
    subject: 'Recolección de respuestas por código',
    descripcion:
      'Cada colaborador entra con un código de un solo uso y responde la encuesta sin necesidad de iniciar sesión. Incluso hay una pantalla que se puede proyectar en una sala para que quien no traiga dispositivo tome su código a la vista.\n\n✅ Terminado.',
  },
  {
    id: 1156,
    subject: 'Índice de clima (0 a 100)',
    descripcion:
      'El sistema calcula automáticamente un indicador de clima del 0 al 100, fácil de entender, y lo clasifica como Sobresaliente, Regular o Crítico. Se puede ver el resultado general, por cada tema evaluado y por cada nivel de la organización (dirección, región, plaza, departamento, etc.).\n\n✅ Terminado.',
  },
  {
    id: 1157,
    subject: 'Medición de la participación',
    descripcion:
      'Muestra cuánta gente respondió frente a quienes debían hacerlo, con un semáforo que indica si el dato es confiable. Así se evita tomar decisiones con información poco representativa.\n\n✅ Terminado.',
  },
  {
    id: 1158,
    subject: 'Planes de acción de mejora automáticos',
    descripcion:
      'Cuando un tema sale bajo, el sistema genera automáticamente un plan de acción con responsable, fecha compromiso y avance, para convertir la medición en mejoras concretas.\n\n✅ Terminado.',
  },
  {
    id: 1159,
    subject: 'Objetivos de mejora y cumplimiento',
    descripcion:
      'Por cada tema se crea un objetivo con su meta, y el sistema calcula qué tanto se cumplió, permitiendo comparar el avance de un período a otro.\n\n✅ Terminado.',
  },
  {
    id: 1160,
    subject: 'Control de acceso por rol y área',
    descripcion:
      'Cada usuario ve únicamente la información que le corresponde: un administrador general ve todo y los demás ven solo su área y las que dependen de ella. Esto aplica en todos los tableros y reportes.\n\n✅ Terminado.',
  },
  {
    id: 1161,
    subject: 'Difusión de encuestas (Humand)',
    descripcion:
      'La encuesta se publica y difunde a los colaboradores a través de Humand, con su mensaje y notificación, ya sea a un área específica o a toda una marca de un solo clic.\n\n✅ Terminado.',
  },
  {
    id: 1162,
    subject: 'Conexión con el tablero de Capital Humano y alertas',
    descripcion:
      'El resultado del clima ya forma parte del tablero principal de Capital Humano, junto con los demás indicadores, y dispara una alerta automática cuando el clima baja de cierto nivel, para poder actuar a tiempo.\n\n✅ Terminado.',
  },
];

console.log('Reescribiendo descripciones a lenguaje de negocio...\n');
for (const d of DESCRIPCIONES) {
  try {
    const r = await actualizarCampos(d.id, { descripcion: d.descripcion });
    console.log(`✅ #${r.id}  ${r.asunto}`);
  } catch (e) {
    console.log(`❌ #${d.id}: ${e.message}`);
  }
}

console.log('\nRenombrando y reescribiendo los 10 módulos...\n');
for (const m of MODULOS) {
  try {
    const r = await actualizarCampos(m.id, { subject: m.subject, descripcion: m.descripcion });
    console.log(`✅ #${r.id}  → "${r.asunto}"`);
  } catch (e) {
    console.log(`❌ #${m.id}: ${e.message}`);
  }
}
