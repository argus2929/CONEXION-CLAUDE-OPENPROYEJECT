// Reescribe tÃ­tulos y descripciones a lenguaje de negocio (quÃ© se hizo / quÃ© se logrÃ³).
//   node --use-system-ca src/rewrite-no-tecnico.js
try { process.loadEnvFile('.env'); } catch {}

import { actualizarCampos } from '../openproject.js';

// Solo descripciÃ³n (mantienen su tÃ­tulo).
const DESCRIPCIONES = [
  {
    id: 1037,
    descripcion:
      'Se identificaron y documentaron las necesidades del mÃ³dulo de Clima Laboral: quÃ© se quiere medir, cÃ³mo, para quiÃ©n y con quÃ© resultados.\n\n' +
      '**Lo que se logrÃ³:** quedÃ³ claro que el sistema debe medir el clima de forma totalmente anÃ³nima, entregar un resultado fÃ¡cil de entender (de 0 a 100), desglosado por toda la organizaciÃ³n, y permitir dar seguimiento a las acciones de mejora.\n\nâœ… Completado.',
  },
  {
    id: 1038,
    descripcion:
      'Se definiÃ³ todo lo que el mÃ³dulo debe hacer, de principio a fin.\n\n' +
      '**Lo que se logrÃ³:** quedÃ³ definido el flujo completo â€” configurar la encuesta, aplicarla de forma anÃ³nima, calcular los resultados, mostrarlos en tableros y generar planes de mejora â€” ademÃ¡s de quÃ© informaciÃ³n puede ver cada persona segÃºn su puesto.\n\nâœ… Completado.',
  },
  {
    id: 1151,
    descripcion:
      'Se construyÃ³ el mÃ³dulo completo de Clima Laboral, listo para usarse.\n\n' +
      '**Lo que se logrÃ³:** un sistema que permite crear y publicar la encuesta, recoger las respuestas de forma totalmente anÃ³nima, calcular el clima de la organizaciÃ³n y mostrar los resultados con planes de mejora automÃ¡ticos. QuedÃ³ al ~85 %, operativo y listo para el prÃ³ximo aÃ±o.\n\nâœ…',
  },
  {
    id: 1150,
    descripcion:
      'Se construyeron los tableros para consultar los resultados de un vistazo.\n\n' +
      '**Lo que se logrÃ³:**\n' +
      '- Un resumen general con los indicadores principales.\n' +
      '- Una vista ejecutiva con mapa de calor y mapa de MÃ©xico por regiÃ³n.\n' +
      '- GrÃ¡ficas comparativas y rankings de las mejores y peores Ã¡reas.\n' +
      '- Un tablero de participaciÃ³n en vivo.\n\n' +
      'AdemÃ¡s, el resultado del clima ya aparece en la pantalla de inicio de Capital Humano.\n\nâœ…',
  },
];

// Renombrar tÃ­tulo + reescribir descripciÃ³n (los 10 "mÃ³dulos").
const MODULOS = [
  {
    id: 1153,
    subject: 'ConfiguraciÃ³n y aplicaciÃ³n de encuestas',
    descripcion:
      'Permite crear la encuesta de clima, definir sus preguntas y los temas a evaluar, y controlar su ciclo: abrirla, cerrarla y abrir un nuevo aÃ±o conservando el historial. Las preguntas se administran en un solo lugar y se aplican a todas las Ã¡reas por igual.\n\nâœ… Terminado.',
  },
  {
    id: 1154,
    subject: 'Anonimato garantizado de los colaboradores',
    descripcion:
      'El sistema protege la identidad de quien responde: nunca se puede saber quÃ© contestÃ³ una persona en particular. Los resultados de grupos muy pequeÃ±os se ocultan para que nadie pueda deducir respuestas individuales y no se guarda ningÃºn dato personal. Esto da confianza para responder con honestidad.\n\nâœ… Terminado.',
  },
  {
    id: 1155,
    subject: 'RecolecciÃ³n de respuestas por cÃ³digo',
    descripcion:
      'Cada colaborador entra con un cÃ³digo de un solo uso y responde la encuesta sin necesidad de iniciar sesiÃ³n. Incluso hay una pantalla que se puede proyectar en una sala para que quien no traiga dispositivo tome su cÃ³digo a la vista.\n\nâœ… Terminado.',
  },
  {
    id: 1156,
    subject: 'Ãndice de clima (0 a 100)',
    descripcion:
      'El sistema calcula automÃ¡ticamente un indicador de clima del 0 al 100, fÃ¡cil de entender, y lo clasifica como Sobresaliente, Regular o CrÃ­tico. Se puede ver el resultado general, por cada tema evaluado y por cada nivel de la organizaciÃ³n (direcciÃ³n, regiÃ³n, plaza, departamento, etc.).\n\nâœ… Terminado.',
  },
  {
    id: 1157,
    subject: 'MediciÃ³n de la participaciÃ³n',
    descripcion:
      'Muestra cuÃ¡nta gente respondiÃ³ frente a quienes debÃ­an hacerlo, con un semÃ¡foro que indica si el dato es confiable. AsÃ­ se evita tomar decisiones con informaciÃ³n poco representativa.\n\nâœ… Terminado.',
  },
  {
    id: 1158,
    subject: 'Planes de acciÃ³n de mejora automÃ¡ticos',
    descripcion:
      'Cuando un tema sale bajo, el sistema genera automÃ¡ticamente un plan de acciÃ³n con responsable, fecha compromiso y avance, para convertir la mediciÃ³n en mejoras concretas.\n\nâœ… Terminado.',
  },
  {
    id: 1159,
    subject: 'Objetivos de mejora y cumplimiento',
    descripcion:
      'Por cada tema se crea un objetivo con su meta, y el sistema calcula quÃ© tanto se cumpliÃ³, permitiendo comparar el avance de un perÃ­odo a otro.\n\nâœ… Terminado.',
  },
  {
    id: 1160,
    subject: 'Control de acceso por rol y Ã¡rea',
    descripcion:
      'Cada usuario ve Ãºnicamente la informaciÃ³n que le corresponde: un administrador general ve todo y los demÃ¡s ven solo su Ã¡rea y las que dependen de ella. Esto aplica en todos los tableros y reportes.\n\nâœ… Terminado.',
  },
  {
    id: 1161,
    subject: 'DifusiÃ³n de encuestas (Humand)',
    descripcion:
      'La encuesta se publica y difunde a los colaboradores a travÃ©s de Humand, con su mensaje y notificaciÃ³n, ya sea a un Ã¡rea especÃ­fica o a toda una marca de un solo clic.\n\nâœ… Terminado.',
  },
  {
    id: 1162,
    subject: 'ConexiÃ³n con el tablero de Capital Humano y alertas',
    descripcion:
      'El resultado del clima ya forma parte del tablero principal de Capital Humano, junto con los demÃ¡s indicadores, y dispara una alerta automÃ¡tica cuando el clima baja de cierto nivel, para poder actuar a tiempo.\n\nâœ… Terminado.',
  },
];

console.log('Reescribiendo descripciones a lenguaje de negocio...\n');
for (const d of DESCRIPCIONES) {
  try {
    const r = await actualizarCampos(d.id, { descripcion: d.descripcion });
    console.log(`âœ… #${r.id}  ${r.asunto}`);
  } catch (e) {
    console.log(`âŒ #${d.id}: ${e.message}`);
  }
}

console.log('\nRenombrando y reescribiendo los 10 mÃ³dulos...\n');
for (const m of MODULOS) {
  try {
    const r = await actualizarCampos(m.id, { subject: m.subject, descripcion: m.descripcion });
    console.log(`âœ… #${r.id}  â†’ "${r.asunto}"`);
  } catch (e) {
    console.log(`âŒ #${m.id}: ${e.message}`);
  }
}
