# 🚀 Drive Estudiantil JLCA

**Sistema de Gestión de Archivos Privado y Multi-usuario**

Drive Estudiantil JLCA es una plataforma de nube privada diseñada para la gestión técnica académica. A diferencia de las soluciones de almacenamiento genéricas, este sistema implementa una **arquitectura de aislamiento lógico**, garantizando que cada usuario posea un espacio de trabajo privado, con permisos granulares y control total desde un panel administrativo centralizado.

---

## 🏛️ Arquitectura Técnica

El sistema ha sido diseñado bajo un modelo **Backend-driven** para asegurar la integridad de los datos:

* **Capa de Autenticación:** Implementación de tokens de sesión (`x-admin-token`) y cabeceras de identidad (`x-username`) para el aislamiento de archivos por propietario.
* **Motor de Persistencia:** Gestión de metadata mediante **SQLite**. El servidor filtra dinámicamente el acceso a los recursos mediante consultas SQL parametrizadas, evitando la exposición de datos no autorizados.
* **Gestión de Archivos:** Ingesta de archivos mediante `Multer` y exportación de directorios comprimidos en tiempo real con `Archiver`.

## ⚙️ Especificaciones del Entorno

### Requisitos Previos
* **Node.js:** Versión 18+ LTS.
* **Database:** SQLite3.
* **Entorno:** Servidor con permisos de escritura en los directorios `/uploads` y `/temp`.

### Estructura de Base de Datos
Es imperativo inicializar la tabla con la columna de pertenencia para habilitar el aislamiento:

```sql
CREATE TABLE archivos (
    id INTEGER PRIMARY KEY,
    nombre TEXT,
    ruta TEXT,
    esCarpeta INTEGER,
    esPrivada INTEGER,
    duenio TEXT -- Columna crítica para el aislamiento multi-usuario
);
