import { createSwaggerSpec } from 'next-swagger-doc';

export function buildOpenApiSpec() {
  return createSwaggerSpec({
    apiFolder: 'app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'PCF Emissions Dashboard API',
        version: '0.1.0',
        description:
          '활동 데이터, 배출계수 + 버전, 회사·국가, 게시물, Excel 임포트를 위한 REST API.',
      },
      tags: [
        { name: 'companies' },
        { name: 'activity-types' },
        { name: 'activities' },
        { name: 'emission-factors' },
        { name: 'posts' },
        { name: 'import' },
        { name: 'health' },
      ],
    },
  });
}
