// GET /api/docs
// Serves the Swagger UI interactive documentation for all backend endpoints.
import { NextResponse } from "next/server";

const spec = {
  openapi: "3.0.0",
  info: {
    title: "Hospital Covadonga PWA API",
    version: "1.0.0",
    description: "Documentación interactiva de las API de la PWA de Hospital Covadonga.",
  },
  servers: [
    {
      url: "/api",
      description: "Servidor Local",
    },
  ],
  paths: {
    "/auth/register": {
      post: {
        summary: "Iniciar Registro de Usuario",
        description: "Envía un código OTP de 6 dígitos al teléfono proporcionado si no está registrado.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nombre: { type: "string", example: "Juan Pérez" },
                  telefono: { type: "string", example: "2711234567" },
                },
                required: ["nombre", "telefono"],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Código enviado exitosamente.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Código enviado. Revisa tus mensajes SMS." },
                    nombre_temp: { type: "string", example: "Juan Pérez" },
                  },
                },
              },
            },
          },
          400: { description: "Datos faltantes o teléfono inválido." },
          409: { description: "El teléfono ya se encuentra registrado." },
          500: { description: "Error interno del servidor." },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Iniciar Sesión",
        description: "Envía un código OTP de 6 dígitos al teléfono proporcionado si ya está registrado.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  telefono: { type: "string", example: "2711234567" },
                },
                required: ["telefono"],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Código enviado exitosamente.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Código enviado. Revisa tus mensajes SMS." },
                  },
                },
              },
            },
          },
          400: { description: "Datos faltantes o teléfono inválido." },
          404: { description: "El usuario no está registrado." },
          500: { description: "Error interno del servidor." },
        },
      },
    },
    "/auth/verify": {
      post: {
        summary: "Verificar Código OTP",
        description: "Verifica el código de un solo uso para iniciar sesión o registrar a un usuario nuevo.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  telefono: { type: "string", example: "2711234567" },
                  codigo: { type: "string", example: "123456" },
                  tipo: { type: "string", enum: ["login", "registro"], example: "registro" },
                  nombre: { type: "string", description: "Obligatorio si tipo es 'registro'", example: "Juan Pérez" },
                },
                required: ["telefono", "codigo", "tipo"],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Autenticación exitosa. Retorna el perfil del usuario.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "string", example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d" },
                        nombre: { type: "string", example: "Juan Pérez" },
                        telefono: { type: "string", example: "2711234567" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Parámetros inválidos o faltantes." },
          401: { description: "Código incorrecto." },
          404: { description: "No hay código pendiente para este teléfono." },
          410: { description: "El código ha expirado." },
          500: { description: "Error interno." },
        },
      },
    },
    "/medicos": {
      get: {
        summary: "Listar Médicos",
        description: "Obtiene el catálogo completo de médicos y sus especialidades.",
        responses: {
          200: {
            description: "Lista de médicos obtenida.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "integer", example: 1 },
                      nombre: { type: "string", example: "Dra. Elena Rostova" },
                      especialidad: { type: "string", example: "Alergología" },
                      consultorio: { type: "string", example: "A-101" },
                    },
                  },
                },
              },
            },
          },
          500: { description: "Error al consultar la base de datos." },
        },
      },
    },
    "/citas": {
      get: {
        summary: "Obtener Citas de un Usuario",
        description: "Obtiene todas las citas agendadas asociadas al número telefónico especificado.",
        parameters: [
          {
            name: "telefono",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Número telefónico de 10 dígitos del paciente/usuario",
            example: "2711234567",
          },
        ],
        responses: {
          200: {
            description: "Lista de citas del usuario.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "integer", example: 12 },
                      medico_id: { type: "integer", example: 3 },
                      nombre_paciente: { type: "string", example: "Juan Pérez" },
                      telefono_paciente: { type: "string", example: "2711234567" },
                      motivo_consulta: { type: "string", example: "Chequeo general" },
                      fecha_hora_inicio: { type: "string", format: "date-time", example: "2026-06-01T10:30:00.000Z" },
                      estado: { type: "string", example: "confirmada" },
                      recordatorio_enviado: { type: "boolean", example: false },
                      medico_nombre: { type: "string", example: "Dra. Carmen Villarreal" },
                      especialidad: { type: "string", example: "Cardiología" },
                      consultorio: { type: "string", example: "C-105" },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Falta el número de teléfono." },
          500: { description: "Error al consultar las citas." },
        },
      },
      post: {
        summary: "Reservar Cita Médica",
        description: "Agenda una nueva cita médica. Valida disponibilidad, evita colisiones y ofrece opciones alternativas en caso de conflicto.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  medicoId: { type: "integer", example: 3 },
                  nombrePaciente: { type: "string", example: "Juan Pérez" },
                  telefonoPaciente: { type: "string", example: "2711234567" },
                  motivoConsulta: { type: "string", example: "Dolor en el pecho" },
                  fechaHoraInicio: { type: "string", format: "date-time", example: "2026-06-01T10:30:00.000Z" },
                },
                required: ["medicoId", "nombrePaciente", "telefonoPaciente", "motivoConsulta", "fechaHoraInicio"],
              },
            },
          },
        },
        responses: {
          201: {
            description: "Cita creada con éxito.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    cita: {
                      type: "object",
                      properties: {
                        id: { type: "integer", example: 15 },
                        medico_id: { type: "integer", example: 3 },
                        nombre_paciente: { type: "string", example: "Juan Pérez" },
                        fecha_hora_inicio: { type: "string", example: "2026-06-01T10:30:00.000Z" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Datos inválidos o el médico no labora en ese día/horario." },
          409: {
            description: "Conflicto de horario. Retorna slots alternativos sugeridos.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string", example: "El horario ya está ocupado por otra cita." },
                    sugeridos: {
                      type: "array",
                      items: { type: "string", example: "11:00" },
                    },
                  },
                },
              },
            },
          },
          500: { description: "Error interno." },
        },
      },
      patch: {
        summary: "Actualizar o Cancelar Cita",
        description: "Edita los detalles de una cita existente (reprogramar doctor/fecha/hora) o la cancela de forma directa.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  id: { type: "integer", example: 12, description: "ID único de la cita a editar" },
                  medico_id: { type: "integer", example: 3, description: "Opcional" },
                  nombre_paciente: { type: "string", example: "Juan Pérez", description: "Opcional" },
                  telefono_paciente: { type: "string", example: "2711234567", description: "Opcional" },
                  motivo_consulta: { type: "string", example: "Resfrío común", description: "Opcional" },
                  fecha_hora_inicio: { type: "string", format: "date-time", example: "2026-06-01T11:00:00.000Z", description: "Opcional" },
                  estado: { type: "string", enum: ["confirmada", "cancelada"], example: "cancelada", description: "Opcional. Si se pasa 'cancelada', se cancela de inmediato sin validar horarios." },
                },
                required: ["id"],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Cita actualizada o cancelada con éxito.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Cita actualizada exitosamente." },
                  },
                },
              },
            },
          },
          400: { description: "ID faltante o parámetros inválidos." },
          404: { description: "La cita especificada no existe." },
          409: {
            description: "Conflicto de horario al reprogramar. Retorna slots alternativos.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string", example: "Este horario ya está ocupado por otro paciente." },
                    suggestedSlots: {
                      type: "array",
                      items: { type: "string", example: "11:30" },
                    },
                  },
                },
              },
            },
          },
          500: { description: "Error interno del servidor." },
        },
      },
    },
    "/citas/slots": {
      get: {
        summary: "Obtener Horarios Disponibles",
        description: "Obtiene los rangos de 30 minutos de disponibilidad de un médico en una fecha específica.",
        parameters: [
          {
            name: "medicoId",
            in: "query",
            required: true,
            schema: { type: "integer" },
            description: "ID del médico",
            example: 1,
          },
          {
            name: "fecha",
            in: "query",
            required: true,
            schema: { type: "string", format: "date" },
            description: "Fecha en formato AAAA-MM-DD",
            example: "2026-06-01",
          },
        ],
        responses: {
          200: {
            description: "Lista de intervalos indicando disponibilidad.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      time: { type: "string", example: "09:00" },
                      available: { type: "boolean", example: true },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Faltan parámetros de consulta." },
          500: { description: "Error al calcular slots." },
        },
      },
    },
    "/cron/reminders": {
      get: {
        summary: "Enviar Recordatorios Programados (Cron)",
        description: "Escanea citas activas que comiencen en aproximadamente 5 horas y envía recordatorios SMS a los pacientes.",
        responses: {
          200: {
            description: "Ejecución de recordatorios exitosa.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    remindersSent: { type: "integer", example: 3 },
                    appointmentIds: {
                      type: "array",
                      items: { type: "integer" },
                      example: [12, 14, 15],
                    },
                  },
                },
              },
            },
          },
          500: { description: "Error interno del servidor durante el envío." },
        },
      },
    },
  },
};

export async function GET() {
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>API Docs - Hospital Covadonga</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
      <style>
        html {
          box-sizing: border-box;
          overflow: -moz-scrollbars-vertical;
          overflow-y: scroll;
        }
        *, *:before, *:after {
          box-sizing: inherit;
        }
        body {
          margin: 0;
          background: #fafafa;
        }
        .swagger-ui .topbar {
          background-color: #0b5cab !important; /* El azul institucional del hospital */
        }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" charset="UTF-8"></script>
      <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
      <script>
        window.onload = function() {
          const ui = SwaggerUIBundle({
            spec: ${JSON.stringify(spec)},
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIStandalonePreset
            ],
            plugins: [
              SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "BaseLayout"
          });
          window.ui = ui;
        };
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
