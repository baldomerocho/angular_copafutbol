# Copa Fútbol - Management System

Este es el sistema de gestión avanzado para ligas y torneos de fútbol, construido sobre Angular 19 y PrimeNG.

## 🚀 Características Principales

- **Gestión Integral**: Control total de Torneos, Equipos, Canchas, Partidos y Pagos.
- **Seguridad Dinámica (RBAC)**: Sistema de autenticación basado en roles con prefijos dinámicos en la API según el rol del usuario (Admin, Staff, Manager).
- **Arquitectura de Servicios**: Capa de servicios robusta con tipado estricto y alineada 100% con la documentación de Swagger.
- **Detección de Interceptor**: Gestión automática de sesiones con JWT a través de interceptores.

## 🛠️ Arquitectura Técnica

### Prefijos de API Dinámicos
El sistema detecta automáticamente el rol del usuario y ajusta las rutas de la API globalmente:
- `/admin/*` para administradores.
- `/staff/*` para personal operativo.
- `/manager/*` para gerentes de equipo.

### Estandarización de Datos (`BaseResponse<T>`)
Todas las respuestas de la API están envueltas en una estructura genérica que facilita el manejo de metadatos y paginación estilo Laravel:
```typescript
interface BaseResponse<T> {
    data: T;
    message?: string;
    meta?: PaginationMeta;
}
```

### Interfaces Centralizadas
Todas las definiciones de modelos y DTOs se encuentran centralizadas en `src/app/pages/service/interfaces/` para asegurar la consistencia en todo el proyecto.

## 💻 Desarrollo

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Servidor de desarrollo**:
   ```bash
   ng serve
   ```
   Navega a `http://localhost:4200/`.

3. **Configuración de Entorno**:
   Los endpoints se configuran en `src/environments/environment.ts` y `environment.prod.ts`.

## 📦 Construcción

Para generar el paquete de producción:
```bash
ng build
```
Los archivos se generarán en la carpeta `dist/`.

---
*Desarrollado para la gestión de ligas profesionales de fútbol.*
