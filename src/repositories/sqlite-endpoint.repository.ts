import sqlite3 from 'sqlite3';
import path from 'path';
import { 
  Endpoint, 
  EndpointRepository, 
  EndpointVersion, 
  DeprecationConfig, 
  VersionChangeType 
} from '../interfaces/endpoint.interface';

export class SqliteEndpointRepository implements EndpointRepository {
  private db: sqlite3.Database;
  private static readonly DB_PATH = path.join(__dirname, '../../api-docs.sqlite');

  constructor() {
    this.db = new sqlite3.Database(SqliteEndpointRepository.DB_PATH);
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS endpoints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        description TEXT,
        group_name TEXT,
        parameters TEXT,
        example_request TEXT,
        example_response TEXT,
        snippets TEXT,
        version TEXT DEFAULT '1.0.0',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        deprecation_status TEXT,
        deprecation_date DATETIME,
        removal_date DATETIME,
        alternative_endpoint TEXT,
        deprecation_reason TEXT,
        
        UNIQUE(endpoint, method)
      )
    `);
  }

  private serializeEndpoint(endpoint: Endpoint): Record<string, any> {
    return {
      endpoint: endpoint.endpoint,
      method: endpoint.method,
      description: endpoint.description,
      group_name: endpoint.group,
      parameters: JSON.stringify(endpoint.parameters || []),
      example_request: endpoint.exampleRequest,
      example_response: endpoint.exampleResponse,
      snippets: JSON.stringify(endpoint.snippets || {})
    };
  }

  private deserializeEndpoint(row: any): Endpoint {
    return {
      endpoint: row.endpoint,
      method: row.method,
      description: row.description,
      group: row.group_name,
      parameters: JSON.parse(row.parameters || '[]'),
      exampleRequest: row.example_request,
      exampleResponse: row.example_response,
      snippets: JSON.parse(row.snippets || '{}')
    };
  }

  async save(endpoint: Endpoint): Promise<void> {
    return new Promise((resolve, reject) => {
      const serializedEndpoint = this.serializeEndpoint(endpoint);
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO endpoints 
        (endpoint, method, description, group_name, parameters, example_request, example_response, snippets, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      stmt.run(
        serializedEndpoint.endpoint,
        serializedEndpoint.method,
        serializedEndpoint.description,
        serializedEndpoint.group_name,
        serializedEndpoint.parameters,
        serializedEndpoint.example_request,
        serializedEndpoint.example_response,
        serializedEndpoint.snippets,
        (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        }
      );
      stmt.finalize();
    });
  }

  async findAll(): Promise<Endpoint[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM endpoints', (err: Error | null, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows.map(row => this.deserializeEndpoint(row)));
      });
    });
  }

  async findByEndpoint(endpoint: string): Promise<Endpoint | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM endpoints WHERE endpoint = ?', [endpoint], (err: Error | null, row: any) => {
        if (err) reject(err);
        else resolve(row ? this.deserializeEndpoint(row) : null);
      });
    });
  }

  async remove(endpoint: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM endpoints WHERE endpoint = ?', [endpoint], function(this: sqlite3.RunResult, err: Error | null) {
        if (err) reject(err);
        else resolve(this.changes || 0);
      });
    });
  }

  async createVersion(endpoint: Endpoint, changeType: VersionChangeType = VersionChangeType.PATCH): Promise<string> {
    // Implementação de criação de versão
    // Lógica de geração de versão semântica
    return '1.0.0'; // Placeholder
  }

  async listVersions(endpoint: string): Promise<EndpointVersion[]> {
    // Implementação de listagem de versões
    return [];
  }

  async compareVersions(endpoint: string, version1: string, version2: string): Promise<any> {
    // Implementação de comparação de versões
    return {};
  }

  async deprecate(endpoint: string, config: Partial<DeprecationConfig>): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        UPDATE endpoints 
        SET 
          deprecation_status = ?, 
          deprecation_date = ?, 
          removal_date = ?, 
          alternative_endpoint = ?, 
          deprecation_reason = ?
        WHERE endpoint = ?
      `);

      stmt.run(
        config.status || 'pending',
        config.deprecatedAt || new Date().toISOString(),
        config.removalDate,
        config.alternativeEndpoint,
        config.reason,
        endpoint,
        (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        }
      );
      stmt.finalize();
    });
  }

  async listDeprecated(): Promise<Array<Endpoint & { deprecationConfig: DeprecationConfig }>> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM endpoints WHERE deprecation_status IS NOT NULL AND deprecation_status != "active"', 
        (err: Error | null, rows: any[]) => {
          if (err) reject(err);
          else {
            const deprecatedEndpoints = rows.map(row => ({
              ...this.deserializeEndpoint(row),
              deprecationConfig: {
                deprecatedAt: row.deprecation_date || new Date().toISOString(),
                removalDate: row.removal_date,
                alternativeEndpoint: row.alternative_endpoint,
                reason: row.deprecation_reason,
                status: row.deprecation_status || 'pending'
              }
            }));
            resolve(deprecatedEndpoints);
          }
        }
      );
    });
  }

  close(): void {
    this.db.close();
  }
} 