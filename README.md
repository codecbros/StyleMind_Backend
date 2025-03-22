
# StyleMind - Backend

## Descripción del Proyecto

Esta aplicación backend es desarrollada con NestJS para la gestión del armario personal de un usuario. Permite a los usuarios añadir, eliminar y modificar prendas de ropa. La funcionalidad principal reside en la generación de conjuntos de ropa personalizados mediante el uso de inteligencia artificial generativa, ofreciendo sugerencias de combinaciones basadas en las prendas disponibles.

## Objetivos

*   Proporcionar una API robusta y escalable para la gestión de prendas de ropa.
*   Implementar un sistema de recomendación de conjuntos de ropa inteligente y personalizado.
*   Integrar con servicios externos para el almacenamiento de imágenes y la generación de contenido con IA.
*   Ofrecer una experiencia de usuario fluida y eficiente a través de la API.

## Guía de Instalación y Despliegue

Esta sección detalla los pasos necesarios para instalar y desplegar el backend de SyleMind.

### Prerrequisitos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

*   **Node.js:** (Versión recomendada: 22 o superior)
*   **yarn** (de preferencia) o **npm** (Viene con Node.js)
*   **Docker:** (Opcional, para despliegue con contenedores)
*   **Docker Compose:** (Opcional, para despliegue con contenedores)

### Servicios Dependientes

El backend de SyleMind depende de los siguientes servicios:

*   **PostgreSQL:** Base de datos relacional para almacenar la información de las prendas, usuarios y conjuntos.
*   **Redis:** Base de datos en memoria para el almacenamiento en caché y la gestión de sesiones.
*   **Firebase Storage:** Servicio de almacenamiento de objetos para las imágenes de las prendas.
*   **Servicio de IA Generativa:** para la generación de conjuntos de ropa.

### Variables de Entorno

El backend requiere las siguientes variables de entorno para funcionar correctamente. Puedes definirlas en un archivo `.env` en la raíz del proyecto.

```
NODE_ENV=development
PORT=3000

# PostgreSQL
DATABASE_URL= postgres://tu_usuario_postgres:tu_contraseña_postgres@tu_host_postgres:tu_puerto_postgres/tu_base_de_datos

# Redis
REDIS_HOST=tu_host_redis
REDIS_PORT=6379
REDIS_PASSWORD=tu_contraseña_redis (si la tienes)
REDIS_USERNAME=(si es necesario)
REDIS_SSL=true|false (dependiendo de si se requiere SSL)

# Firebase
FIREBASE_PROJECT_ID=tu_proyecto_id
FIREBASE_API_KEY=tu_api_key_firebase
FIREBASE_BUCKET_NAME=tu-bucket-name
FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
FIREBASE_APP_ID=tu_app_id

# Servicio de IA Generativa
GOOGLE_GENERATIVE_AI_API_KEY=tu_api_key_google
```

**Importante:**

*   Reemplaza los valores de ejemplo con tus propias credenciales.

### Instalación

1.  **Clonar el repositorio:**

    ```bash
    git clone https://github.com/codecbros/StyleMind_Backend.git
    cd SyleMind-backend
    ```

2.  **Instalar las dependencias:**

    ```bash
    yarn install  # o npm install
    ```

3.  **Configurar las variables de entorno:**

    Crea un archivo `.env` en la raíz del proyecto y completa las variables de entorno como se describe en la sección anterior.

4.  **Ejecutar las migraciones de la base de datos:**

    ```bash
    yarn prisma migrate deploy  # o npm run prisma migration production
    ```

### Despliegue

Aquí se describen algunas opciones para desplegar el backend de SyleMind.

#### 1. Despliegue Local (Desarrollo)

```bash
yarn run start:dev  # o yarn dev
```

Esto iniciará el servidor en modo de desarrollo con recarga automática.

#### 2. Despliegue con Docker

1.  **Construir la imagen de Docker:**

    ```bash
    docker build -t SyleMind-backend .
    ```

2.  **Ejecutar el contenedor Docker:**

    ```bash
    docker run -d -p 3000:3000 \
      -e NODE_ENV=production \
        -e PORT=3000 \

    ```

    **Importante:**

    *   Reemplaza los valores entre `<>` con tus propias credenciales.
    *   Considera usar un archivo `.env` y la opción `--env-file` de Docker para gestionar las variables de entorno.

#### 3. Despliegue con Docker Compose

1.  **Crear un archivo `docker-compose.yml`:**
[Docker compose](https://github.com/codecbros/StyleMind_Backend/blob/main/docker-compose.yml)
2.  **Ejecutar Docker Compose:**

    ```bash
    docker-compose up -d
    ```

    Asegúrate de tener las variables de entorno definidas en un archivo `.env` en la misma carpeta que el `docker-compose.yml`.


## Contribución

Si deseas contribuir al proyecto, por favor, sigue estas pautas:

1.  Crea un fork del repositorio.
2.  Crea una rama para tu funcionalidad o corrección de errores.
3.  Realiza tus cambios y asegúrate de que pasen todas las pruebas.
4.  Envía una solicitud de extracción (Pull Request) con una descripción clara de tus cambios.

## Licencia

Gpl-3.0
