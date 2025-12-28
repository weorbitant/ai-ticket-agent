import axios, { AxiosInstance } from "axios";
import { type Ticket } from "../../../domain/models/ticket.js";
import { type TicketRepositoryPort } from "../../../domain/ports/output/ticket-repository.port.js";
import { jiraSearchResponseSchema, type JiraIssue, toTicket } from "./types.js";

export interface JiraAdapterOptions {
  baseUrl: string;
  email: string;
  apiToken: string;
}

/**
 * Jira adapter implementing TicketRepositoryPort.
 */
export class JiraAdapter implements TicketRepositoryPort {
  private client: AxiosInstance;

  constructor(options: JiraAdapterOptions) {
    const auth = Buffer.from(`${options.email}:${options.apiToken}`).toString("base64");

    this.client = axios.create({
      baseURL: `${options.baseUrl}/rest/api/3`,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000,
    });
  }

  async search(jql: string, limit: number): Promise<Ticket[]> {
    try {
      const response = await this.client.post("/search/jql", {
        jql,
        maxResults: limit,
        fields: [
          "summary",
          "status",
          "issuetype",
          "priority",
          "assignee",
          "reporter",
          "created",
          "updated",
          "components",
          "labels",
          "description",
          "customfield_10031", // Story Points
        ],
      });

      const parsed = jiraSearchResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        console.error("Jira response validation errors:", parsed.error.errors);
        // Return raw data if validation fails but structure seems ok
        const issues = response.data.issues as JiraIssue[];
        return issues.map(toTicket);
      }

      return parsed.data.issues.map(toTicket);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Error de autenticación con Jira. Verifica tus credenciales.");
        }
        if (error.response?.status === 400) {
          const errorMessages = error.response.data?.errorMessages || [];
          throw new Error(`Error en la consulta JQL: ${errorMessages.join(", ")}`);
        }
        throw new Error(`Error al consultar Jira: ${error.message}`);
      }
      throw error;
    }
  }

  async getByKey(key: string): Promise<Ticket> {
    try {
      const response = await this.client.get(`/issue/${key}`);
      return toTicket(response.data as JiraIssue);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Issue ${key} no encontrado.`);
        }
        throw new Error(`Error al obtener issue: ${error.message}`);
      }
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get("/myself");
      return true;
    } catch {
      return false;
    }
  }
}

