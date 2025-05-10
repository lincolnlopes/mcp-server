export interface EndpointParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
}

export interface CodeSnippet {
  [language: string]: string;
}

export interface Endpoint {
  [key: string]: any;
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

export interface EndpointVersion extends Endpoint {
  version: string;
  createdAt: string;
  notes?: string;
}

export interface DeprecationConfig {
  deprecatedAt: string;
  removalDate?: string;
  alternativeEndpoint?: string;
  reason?: string;
  status: 'pending' | 'scheduled' | 'deprecated';
}

export enum VersionChangeType {
  PATCH = 'patch',
  MINOR = 'minor',
  MAJOR = 'major'
}

export interface EndpointValidator {
  validate(endpoint: Endpoint): boolean;
}

export interface EndpointRepository {
  save(endpoint: Endpoint): Promise<void>;
  findAll(): Promise<Endpoint[]>;
  findByEndpoint(endpoint: string): Promise<Endpoint | null>;
}

export interface DocumentationService {
  createEndpoint(endpoint: Endpoint): Promise<void>;
  updateEndpoint(endpoint: Endpoint): Promise<void>;
} 