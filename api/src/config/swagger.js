/**
 * Swagger/OpenAPI Configuration
 * API Documentation setup using Swagger UI
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NodeJs - Backend',
      version: process.env.API_VERSION || '1.0.0',
      description: 'Comprehensive REST API documentation for Node.js Backend',
      contact: {
        name: 'API Support',
        email: process.env.SUPPORT_EMAIL
      },
      license: {
        name: 'ISC',
        url: process.env.SUPPORT_URL
      }
    },
    servers: [
      {
        url: process.env.API_URL || `http://localhost:${process.env.PROXY_PORT || process.env.API_INTERNAL_PORT}`,
        description: process.env.MODE || 'api/dev/v1'
      },
      {
        url: process.env.API_URL || `http://localhost:${process.env.PROXY_PORT || process.env.API_INTERNAL_PORT}`,
        description: 'production/v1'
      },
      {
        url: process.env.API_URL_STAGING || `http://localhost:${process.env.PROXY_PORT || process.env.API_INTERNAL_PORT}`,
        description: 'staging/v1'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        },
        basicAuth: {
          type: 'http',
          scheme: 'basic',
          description: 'Basic authentication with username and password'
        },
        oauth2: {
          type: 'oauth2',
          flows: {
            password: {
              tokenUrl: `/${process.env.MODE || 'api'}/token`,
              scopes: {}
            }
          },
          description: 'OAuth2 password flow - enter username and password to authenticate and get access token. The token will be automatically used for protected endpoints.'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            error: {
              type: 'string',
              example: 'Detailed error description'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Success message'
            },
            data: {
              type: 'object'
            },
            meta: {
              type: 'object'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            first_name: {
              type: 'string',
              example: 'John'
            },
            last_name: {
              type: 'string',
              example: 'Doe'
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'],
              example: 'ACTIVE'
            },
            is_active: {
              type: 'boolean',
              example: true
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            title: {
              type: 'string',
              example: 'Notification Title'
            },
            message: {
              type: 'string',
              example: 'Notification message content'
            },
            notification_type: {
              type: 'string',
              example: 'system'
            },
            status: {
              type: 'string',
              enum: ['unread', 'read', 'archived'],
              example: 'unread'
            },
            priority: {
              type: 'string',
              enum: ['low', 'normal', 'high', 'urgent'],
              example: 'normal'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Unauthorized',
                error: 'Invalid or missing authentication token'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Resource not found',
                error: 'The requested resource does not exist'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Validation failed',
                error: 'Invalid input data'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Internal server error',
                error: 'An unexpected error occurred'
              }
            }
          }
        },
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Profile & Settings',
        description: 'User profile and settings management endpoints'
      },
      {
        name: 'Upload Media',
        description: 'Media upload to Google Cloud Storage endpoints'
      },
      {
        name: 'Health & Monitoring',
        description: 'Health check and system status endpoints'
      },
      {
        name: 'WebSocket/Streaming',
        description: 'WebSocket and Server-Sent Events for real-time updates'
      }
    ]
  },
  apis: [
    './router/**/*.js',
    './server.js'
  ]
};

// Generate Swagger spec dynamically to pick up new endpoints
function getSwaggerSpec() {
  return swaggerJsdoc(options);
}

// Generate initial spec
const swaggerSpec = getSwaggerSpec();

const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Node.js Backend API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    oauth: {
      clientId: 'swagger-ui',
      clientSecret: 'swagger-ui-secret',
      realm: 'Node.js Backend API',
      appName: 'Swagger UI',
      scopeSeparator: ' ',
      additionalQueryStringParams: {},
      useBasicAuthenticationWithAccessCodeGrant: false,
      usePkceWithAuthorizationCodeGrant: false
    },
    // Enable OAuth2 password flow
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch', 'head', 'options']
  }
};

module.exports = {
  getSwaggerSpec,
  swaggerSpec,
  swaggerUi,
  swaggerOptions
};

