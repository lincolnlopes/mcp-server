import { Endpoint, EndpointValidator } from '../interfaces/endpoint.interface';

export class EndpointValidatorImpl implements EndpointValidator {
  private static readonly MAX_LENGTH = 500;
  private static readonly VALID_HTTP_METHODS: Endpoint['method'][] = [
    'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'
  ];

  private validateRequiredFields(endpoint: Endpoint): boolean {
    const requiredFields: (keyof Endpoint)[] = ['endpoint', 'method', 'description'];
    
    for (const field of requiredFields) {
      if (!endpoint[field] || String(endpoint[field]).trim() === '') {
        console.error(`Validação falhou: campo ${field} é obrigatório`);
        return false;
      }
    }
    return true;
  }

  private validateHttpMethod(method: Endpoint['method']): boolean {
    if (!EndpointValidatorImpl.VALID_HTTP_METHODS.includes(method)) {
      console.error(`Método HTTP inválido: ${method}`);
      return false;
    }
    return true;
  }

  private validateEndpointFormat(endpoint: string): boolean {
    const endpointRegex = /^\/[a-zA-Z0-9_\-\/]+$/;
    if (!endpointRegex.test(endpoint)) {
      console.error(`Formato de endpoint inválido: ${endpoint}`);
      return false;
    }
    return true;
  }

  private validateParameters(endpoint: Endpoint): boolean {
    if (endpoint.parameters) {
      for (const param of endpoint.parameters) {
        if (!param.name || param.name.trim() === '') {
          console.error('Nome de parâmetro inválido');
          return false;
        }

        const validTypes = ['string', 'number', 'boolean', 'array', 'object'];
        if (!validTypes.includes(param.type)) {
          console.error(`Tipo de parâmetro inválido: ${param.type}`);
          return false;
        }
      }
    }
    return true;
  }

  private validateTextFieldLengths(endpoint: Endpoint): boolean {
    const fieldsToValidate: (keyof Endpoint)[] = [
      'description', 'exampleRequest', 'exampleResponse'
    ];

    for (const field of fieldsToValidate) {
      const value = endpoint[field];
      if (typeof value === 'string' && value.length > EndpointValidatorImpl.MAX_LENGTH) {
        console.error(`Campo ${field} excede o tamanho máximo permitido`);
        return false;
      }
    }
    return true;
  }

  validate(endpoint: Endpoint): boolean {
    return (
      this.validateRequiredFields(endpoint) &&
      this.validateHttpMethod(endpoint.method) &&
      this.validateEndpointFormat(endpoint.endpoint) &&
      this.validateParameters(endpoint) &&
      this.validateTextFieldLengths(endpoint)
    );
  }
} 