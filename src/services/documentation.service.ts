import { 
  Endpoint, 
  DocumentationService, 
  EndpointRepository, 
  EndpointValidator,
  VersionChangeType,
  DeprecationConfig
} from '../interfaces/endpoint.interface';

export class DocumentationServiceImpl implements DocumentationService {
  constructor(
    private repository: EndpointRepository,
    private validator: EndpointValidator
  ) {}

  async createEndpoint(endpoint: Endpoint): Promise<void> {
    // Aplicar validação antes de salvar
    if (!this.validator.validate(endpoint)) {
      throw new Error('Endpoint inválido. Verifique os dados.');
    }

    // Verificar se o endpoint já existe
    const existingEndpoint = await this.repository.findByEndpoint(endpoint.endpoint);
    if (existingEndpoint) {
      throw new Error(`Endpoint ${endpoint.endpoint} já existe.`);
    }

    // Salvar no repositório
    await this.repository.save(endpoint);
  }

  async updateEndpoint(endpoint: Endpoint): Promise<void> {
    // Validar endpoint
    if (!this.validator.validate(endpoint)) {
      throw new Error('Endpoint inválido. Verifique os dados.');
    }

    // Verificar se o endpoint existe antes de atualizar
    const existingEndpoint = await this.repository.findByEndpoint(endpoint.endpoint);
    if (!existingEndpoint) {
      throw new Error(`Endpoint ${endpoint.endpoint} não encontrado.`);
    }

    // Atualizar no repositório
    await this.repository.save(endpoint);
  }

  async versionEndpoint(
    endpoint: string, 
    changeType: VersionChangeType = VersionChangeType.PATCH
  ): Promise<string> {
    // Buscar endpoint existente
    const existingEndpoint = await this.repository.findByEndpoint(endpoint);
    if (!existingEndpoint) {
      throw new Error(`Endpoint ${endpoint} não encontrado.`);
    }

    // Criar nova versão
    return this.repository.createVersion(existingEndpoint, changeType);
  }

  async deprecateEndpoint(
    endpoint: string, 
    config: Partial<DeprecationConfig>
  ): Promise<void> {
    // Verificar se o endpoint existe
    const existingEndpoint = await this.repository.findByEndpoint(endpoint);
    if (!existingEndpoint) {
      throw new Error(`Endpoint ${endpoint} não encontrado.`);
    }

    // Aplicar deprecation
    await this.repository.deprecate(endpoint, {
      status: 'deprecated',
      deprecatedAt: new Date().toISOString(),
      ...config
    });
  }

  async searchEndpoints(criteria: Partial<Endpoint>): Promise<Endpoint[]> {
    // Buscar todos os endpoints
    const allEndpoints = await this.repository.findAll();

    // Filtrar baseado nos critérios
    return allEndpoints.filter(endpoint => 
      Object.entries(criteria).every(([key, value]) => 
        endpoint[key as keyof Endpoint] === value
      )
    );
  }
} 