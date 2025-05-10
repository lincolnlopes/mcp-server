// Interface para definição de parâmetros de endpoint
export interface EndpointParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
}

// Interface para snippet de código
export interface CodeSnippet {
  [language: string]: string;
}

// Interface para endpoint
export interface Endpoint {
  id?: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
  description: string;
  group?: string;
  parameters?: EndpointParameter[];
  exampleRequest?: string;
  exampleResponse?: string;
  snippets?: CodeSnippet;
}

// Interface para versionamento
export interface EndpointVersion extends Endpoint {
  version: string;
  createdAt: string;
  notes?: string;
}

// Interface para deprecation
export interface DeprecationConfig {
  deprecatedAt: string;
  removalDate?: string;
  alternativeEndpoint?: string;
  reason?: string;
  status: 'pending' | 'scheduled' | 'deprecated';
}

// Enum para tipos de mudança de versão
export enum VersionChangeType {
  PATCH = 'patch',
  MINOR = 'minor',
  MAJOR = 'major'
}

// Interface para repositório de endpoints
export interface EndpointRepository {
  save(endpoint: Endpoint): Promise<void>;
  findAll(): Promise<Endpoint[]>;
  findByEndpoint(endpoint: string): Promise<Endpoint | null>;
  remove(endpoint: string): Promise<number>;
  createVersion(endpoint: Endpoint, changeType?: VersionChangeType): Promise<string>;
  listVersions(endpoint: string): Promise<EndpointVersion[]>;
  compareVersions(endpoint: string, version1: string, version2: string): Promise<any>;
  deprecate(endpoint: string, config: Partial<DeprecationConfig>): Promise<void>;
  listDeprecated(): Promise<Array<Endpoint & { deprecationConfig: DeprecationConfig }>>;
}

// Interface para serviço de documentação
export interface DocumentationService {
  createEndpoint(endpoint: Endpoint): Promise<void>;
  updateEndpoint(endpoint: Endpoint): Promise<void>;
  versionEndpoint(endpoint: string, changeType?: VersionChangeType): Promise<string>;
  deprecateEndpoint(endpoint: string, config: Partial<DeprecationConfig>): Promise<void>;
  searchEndpoints(criteria: Partial<Endpoint>): Promise<Endpoint[]>;
}

// Interface para validação de endpoints
export interface EndpointValidator {
  validate(endpoint: Endpoint): boolean;
} 