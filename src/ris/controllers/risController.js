const repo = require("../repositories/risRepository");
const orthanc = require("../services/orthancService");
const his = require("../services/hisIntegrationService");
async function dashboard(req, res) {
  res.render("dashboard/index", {
    title: "Dashboard RIS",
    stats: await repo.stats(),
  });
}
async function orders(req, res) {
  res.render("ordenes/index", {
    title: "Órdenes radiológicas",
    ordenes: await repo.orders(),
  });
}
async function studies(req, res) {
  res.render("estudios/index", {
    title: "Estudios radiológicos",
    estudios: await repo.studies(),
  });
}
async function studyShow(req, res) {
  const estudio = await repo.studyById(req.params.id);
  const pacs = await repo.pacsByStudy(req.params.id);
  res.render("estudios/show", { title: "Detalle estudio", estudio, pacs });
}
async function execution(req, res) {
  res.render("ejecucion/index", {
    title: "Ejecución tecnológica",
    estudios: await repo.executionWorklist(),
  });
}
async function executeStudy(req, res) {
  await repo.markExecuted(req.params.id);
  res.redirect("/ejecucion");
}
async function agenda(req, res) {
  res.render("agenda/index", {
    title: "Agenda radiológica",
    agenda: await repo.agenda(),
  });
}
async function agendaCreate(req, res) {
  const data = await repo.agendaFormData();
  res.render("agenda/create", {
    title: "Crear agenda radiológica",
    ...data,
    error: null,
  });
}
async function agendaStore(req, res) {
  try {
    await repo.createAgenda(req.body);
    res.redirect("/agenda");
  } catch (e) {
    const data = await repo.agendaFormData();
    res.status(400).render("agenda/create", {
      title: "Crear agenda radiológica",
      ...data,
      error: e.message,
    });
  }
}
async function orthancFindForm(req, res) {
  res.render("orthanc/find", {
    title: "Búsqueda Orthanc /tools/find",
    results: null,
    error: null,
  });
}
async function orthancFind(req, res) {
  try {
    const query = {
      Level: req.body.level || "Study",
      Query: {
        PatientID: req.body.patient_id || "*",
        StudyDescription: req.body.description || "*",
      },
    };
    const results = await orthanc.toolsFind(query);
    res.render("orthanc/find", {
      title: "Búsqueda Orthanc /tools/find",
      results,
      error: null,
    });
  } catch (e) {
    res.render("orthanc/find", {
      title: "Búsqueda Orthanc /tools/find",
      results: null,
      error: e.message,
    });
  }
}
async function linkPacs(req, res) {
  await repo.savePacsReference(req.params.id, req.body.orthanc_study_id);
  res.redirect(`/estudios/${req.params.id}`);
}
async function reports(req, res) {
  res.render("informes/index", {
    title: "Informes radiológicos",
    informes: await repo.reports(),
    pendientes: await repo.reportWorklist(),
  });
}
async function reportForm(req, res) {
  const estudio = await repo.studyById(req.params.id);
  const relacionados = await repo.relatedStudies(req.params.id);
  res.render("informes/form", {
    title: "Crear informe",
    estudio,
    relacionados,
    error: null,
  });
}
async function saveReport(req, res) {
  const id = await repo.createOrUpdateReportFull(req.params.id, req.body);
  res.redirect(`/informes/${id}/validar`);
}
async function validationShow(req, res) {
  const informe = await repo.reportById(req.params.id);
  if (!informe) return res.status(404).send("Informe no encontrado");
  res.render("informes/validar", {
    title: "Validar informe radiológico",
    informe,
    error: null,
  });
}
async function validateAndSend(req, res) {
  try {
    await repo.validateReport(req.params.id, req.user);
    await his.sendValidatedReportToHis(req.params.id);
    res.redirect("/informes");
  } catch (e) {
    const informe = await repo.reportById(req.params.id);
    res.status(400).render("informes/validar", {
      title: "Validar informe radiológico",
      informe,
      error: e.message,
    });
  }
}
async function patients(req, res) {
  const search = req.query.search || "";
  res.render("pacientes/index", {
    title: "Pacientes RIS",
    pacientes: await repo.patients(search),
    search,
  });
}
async function patientHistory(req, res) {
  const data = await repo.patientHistory(req.params.id);
  if (!data.paciente) return res.status(404).send("Paciente no encontrado");
  res.render("pacientes/historial", {
    title: "Historial radiológico",
    ...data,
  });
}
async function audit(req, res) {
  res.render("auditoria/index", {
    title: "Auditoría RIS",
    auditoria: await repo.audit(),
  });
}
module.exports = {
  dashboard,
  orders,
  studies,
  studyShow,
  execution,
  executeStudy,
  agenda,
  agendaCreate,
  agendaStore,
  orthancFindForm,
  orthancFind,
  linkPacs,
  reports,
  reportForm,
  saveReport,
  validationShow,
  validateAndSend,
  patients,
  patientHistory,
  audit,
};
