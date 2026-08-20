import axios from "axios";
import moment from "moment";

import { BaseUrl } from "../../providers/_config";
import { getTokenParameters } from "../../providers/sessionStorage";

const headers = () => ({ gametoken: getTokenParameters("gameToken") });

// ─── RF02 / RF05 — Geração de relatório clínico (Azure Function GenerateClinicalReport) ──

export const generateClinicalReport = async (patientId, { device, period }) => {
  const response = await axios.post(
    `${BaseUrl()}/pacients/${patientId}/clinicalreport/generate`,
    { device, period },
    { headers: headers() }
  );
  return response.data; // { success, message, data }
};

// ─── RF11 — Histórico de relatórios (Azure Function GetClinicalReports) ──────────────────

export const fetchClinicalReportsHistory = async (patientId, { dataIni, dataFim } = {}) => {
  const params = new URLSearchParams();
  if (dataIni) params.set("dataIni", dataIni);
  if (dataFim) params.set("dataFim", dataFim);
  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await axios.get(`${BaseUrl()}/pacients/${patientId}/clinicalreport${query}`, {
    headers: headers(),
  });
  return response.data.data || [];
};

// ─── Perfil do paciente (usado como referência de FR na aba Gráficos) ───────────────────

export const fetchPacientProfile = async (patientId) => {
  const response = await axios.get(`${BaseUrl()}/pacients/${patientId}`, { headers: headers() });
  return response.data.data;
};

// ─── Períodos de referência pré-definidos (Tela 5 — Gerar relatório) ─────────────────────

export const PERIOD_PRESETS = [
  { key: "semana", label: "Última semana", days: 7 },
  { key: "2semanas", label: "Últimas 2 semanas", days: 14 },
  { key: "mes", label: "Último mês", days: 30 },
];

export const buildPeriodFromPreset = (presetKey, customStart, customEnd) => {
  if (presetKey === "personalizado") {
    return {
      start: moment(customStart).startOf("day").toISOString(),
      end: moment(customEnd).endOf("day").toISOString(),
      label: moment(customStart).format("DD/MM") + " – " + moment(customEnd).format("DD/MM"),
    };
  }
  const preset = PERIOD_PRESETS.find((p) => p.key === presetKey);
  const end = moment().endOf("day");
  const start = moment().subtract(preset.days, "days").startOf("day");
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    label: start.format("DD/MM") + " – " + end.format("DD/MM"),
  };
};

// ─── RF07 — Dados para os gráficos longitudinais (DJ, CGc, FR) ──────────────────────────
// DJ vem de plataformoverviews.scoreRatio, CGc de gameparameters.ObjectSpeedFactor —
// ambos marcados como "CONFIRMAR" em shared/clinicalMetrics.js no backend, mesma ressalva
// vale aqui. FR não tem série temporal por sessão no modelo atual (é um valor de
// calibração fixo do paciente) — é exibido como referência, não como linha por sessão.

export const fetchPlataformSeries = async (patientId, device) => {
  const response = await axios.get(
    `${BaseUrl()}/pacients/${patientId}/plataforms/statistics?sort=asc&gameDevice=${device}`,
    { headers: headers() }
  );
  return (response.data.data || []).map((s) => ({
    date: moment(s.playFinish).format("DD/MM"),
    timestamp: new Date(s.playFinish).getTime(),
    DJ: s.scoreRatio != null ? parseFloat(s.scoreRatio) : null, // ver ressalva acima — mesmo campo usado em shared/clinicalMetrics.js
  }));
};

export const fetchGameParameterSeries = async (patientId) => {
  const response = await axios.get(`${BaseUrl()}/gameparameter?pacientId=${patientId}`, {
    headers: headers(),
  });
  return (response.data.data || [])
    .map((g) => ({
      date: moment(g.created_at).format("DD/MM"),
      timestamp: new Date(g.created_at).getTime(),
      CGc: g.ObjectSpeedFactor,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
};

// ─── Upload de log (caminho alternativo/opcional — Tela 5) ───────────────────────────────
// Reaproveita o endpoint /plataforms (SendPlataformOverview) já existente e validado no
// backend: cada sessão do arquivo é enviada como se fosse o próprio jogo mandando. Isso
// evita duplicar a validação de schema em dois lugares.

const PLATAFORM_REQUIRED_FIELDS = [
  "playStart", "playFinish", "duration", "result", "stageId", "phase", "level",
  "score", "maxScore", "scoreRatio",
];

// Campos numéricos com default 0 quando ausentes — não bloqueiam a importação,
// só ficam menos completos nas métricas de alvos/obstáculos.
const PLATAFORM_OPTIONAL_NUMERIC_FIELDS = [
  "TargetsSpawned", "TargetsSuccess", "TargetsInsSuccess", "TargetsExpSuccess",
  "TargetsFails", "TargetsInsFail", "TargetsExpFail",
  "ObstaclesSpawned", "ObstaclesSuccess", "ObstaclesInsSuccess", "ObstaclesExpSuccess",
  "ObstaclesFail", "ObstaclesInsFail", "ObstaclesExpFail",
  "PlayerHp", "BorgScale",
];

function normalizeSession(raw, index, device) {
  const missing = PLATAFORM_REQUIRED_FIELDS.filter((f) => raw[f] === undefined || raw[f] === null || raw[f] === "");
  if (missing.length) {
    throw new Error(`Sessão ${index + 1}: campos obrigatórios ausentes (${missing.join(", ")}).`);
  }

  const session = {
    playStart: raw.playStart,
    playFinish: raw.playFinish,
    duration: Number(raw.duration),
    result: String(raw.result),
    stageId: Number(raw.stageId),
    phase: Number(raw.phase),
    level: Number(raw.level),
    relaxTimeSpawned: raw.relaxTimeSpawned === true || raw.relaxTimeSpawned === "true",
    score: Number(raw.score),
    maxScore: Number(raw.maxScore),
    scoreRatio: Number(raw.scoreRatio),
    gameDevice: raw.gameDevice || device,
  };

  PLATAFORM_OPTIONAL_NUMERIC_FIELDS.forEach((f) => {
    session[f] = raw[f] !== undefined && raw[f] !== "" ? Number(raw[f]) : 0;
  });

  // Curva de fluxo bruta: só o .json exportado com flowDataDevices traz isso de verdade.
  // Para .csv (ou .json sem essa informação), sintetiza um único ponto por sessão a
  // partir de um valor médio informado — suficiente pra validação do backend, mas NÃO
  // equivalente à curva real (sem granularidade temporal).
  if (Array.isArray(raw.flowDataDevices) && raw.flowDataDevices.length) {
    session.flowDataDevices = raw.flowDataDevices;
  } else {
    const approxFlow = raw.flowValue != null ? Number(raw.flowValue) : session.scoreRatio * 100;
    session.flowDataDevices = [{
      deviceName: session.gameDevice,
      flowData: [{ flowValue: approxFlow, timestamp: raw.playStart }],
    }];
  }

  return session;
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headerCols = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).filter((l) => l.trim().length).map((line) => {
    const cols = line.split(",");
    const row = {};
    headerCols.forEach((h, i) => { row[h] = cols[i] !== undefined ? cols[i].trim() : ""; });
    return row;
  });
}

export const parseLogFile = (file) =>
  new Promise((resolve, reject) => {
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () => {
      try {
        let rawSessions;
        if (ext === ".json") {
          const parsed = JSON.parse(reader.result);
          rawSessions = Array.isArray(parsed) ? parsed : parsed.sessions;
          if (!Array.isArray(rawSessions)) {
            throw new Error("O .json deve ser uma lista de sessões, ou um objeto com a chave 'sessions'.");
          }
        } else if (ext === ".csv") {
          rawSessions = parseCsv(reader.result);
        } else {
          throw new Error("Formato não suportado. Envie um arquivo .json ou .csv.");
        }
        resolve(rawSessions);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });

export const importSessions = async (patientId, device, rawSessions) => {
  const results = { success: 0, failed: [] };
  for (let i = 0; i < rawSessions.length; i++) {
    try {
      const session = normalizeSession(rawSessions[i], i, device);
      await axios.post(`${BaseUrl()}/plataforms`, { pacientId: patientId, ...session }, { headers: headers() });
      results.success++;
    } catch (err) {
      const message = (err.response && err.response.data && err.response.data.message) || err.message;
      results.failed.push({ index: i, message });
    }
  }
  return results;
};
