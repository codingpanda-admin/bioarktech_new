# BioArk Tech — Portal de Reactivos y Consumibles Científicos

Este es el repositorio central de **BioArk Tech**, una plataforma web premium diseñada para la gestión, visualización y cotización de reactivos biológicos y consumibles de laboratorio.

El proyecto está completamente contenedorizado con **Docker Compose**, integrando un frontend moderno en React, un backend robusto en Django y una base de datos PostgreSQL.

---

## 🚀 Requisitos Previos

Asegúrate de tener instalado en tu sistema:
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (incluyendo Docker Compose)
* Git

---

## 🛠️ Arquitectura del Proyecto

El entorno se compone de tres contenedores de Docker principales:

1. **`bioark_postgres` (Base de Datos):**
   * Motor: PostgreSQL 16.
   * Inicialización: Carga automáticamente el volcado de la base de datos `backend/bioarktech.sql` la primera vez que se levanta el volumen, asegurando que todo el catálogo de productos esté disponible de inmediato.
2. **`bioark_backend` (Backend API):**
   * Framework: Django + Django REST Framework.
   * Puertos: Expuesto en `http://localhost:8000`.
   * Responsabilidades: Autenticación de usuarios, endpoints de búsqueda optimizada con soporte de categorías, cálculo de cotizaciones y procesamiento SMTP.
3. **`bioark_frontend` (Frontend Web):**
   * Framework: React + Vite (estructurado de forma limpia y modular en `/components` y `/pages`).
   * Puertos: Expuesto en `http://localhost:5173`.
   * Estilos: CSS puro con variables y animaciones fluidas (sin TailwindCSS).

---

## 🚦 Cómo Levantar el Proyecto

Sigue estos sencillos pasos para iniciar todo el entorno de desarrollo:

### 1. Levantar los Contenedores
Abre tu terminal en la raíz del proyecto y ejecuta el comando de construcción e inicio:
```bash
docker compose up --build -d
```
Esto descargará las imágenes necesarias, compilará el frontend, preparará el backend e importará el esquema inicial de datos.

### 2. Acceso a las Aplicaciones
Una vez que los contenedores estén activos (puedes verificarlo con `docker ps`), podrás ingresar a:
* **Frontend Web:** [http://localhost:5173](http://localhost:5173)
* **Consola de Administración:** [http://localhost:5173/admin](http://localhost:5173/admin)
* **Backend API:** [http://localhost:8000](http://localhost:8000)

---

## 📦 Reglas de Negocio del Inventario y Carrito

### 1. Reactivos vs. Consumibles
El inventario está clasificado en dos grandes tipos a través de la API del backend:
* **Reactivos y Kits ($40 USD de envío):** Incluye enzimas, marcadores de ADN/proteína, master mixes para qPCR y buffers. Requieren envío refrigerado (hielo húmedo o seco).
* **Consumibles y Sistemas ($100 USD de envío):** Incluye puntas de pipeta, crioviales, cajas de almacenamiento, placas de qPCR, tubos de centrífuga, platos de cultivo celular y guantes de nitrilo.

### 2. Lógica del Envío Plano
El costo de envío se calcula de forma **plana por pedido completo** (no acumulable por cantidad o tipo de producto individual):
* Si la orden contiene **al menos un consumible**, la tarifa total de envío de la orden es de **$100.00 USD**.
* Si la orden contiene **únicamente reactivos**, la tarifa total de envío de la orden es de **$40.00 USD**.
* Si el carrito está vacío, la tarifa es de **$0.00 USD**.

---

## ⚙️ Comandos Útiles de Mantenimiento

### Levantar y Apagar Servicios
* **Iniciar entorno:** `docker compose up -d`
* **Detener entorno (conservando datos):** `docker compose down`
* **Reiniciar entorno rápidamente:** `docker compose restart`

### Restablecer la Base de Datos desde Cero
Si deseas limpiar todos los datos del volumen de PostgreSQL para forzar una reinicialización limpia a partir del volcado SQL de inventario:
```bash
# Apagar contenedores y limpiar volúmenes de datos
docker compose down -v

# Levantar de nuevo el proyecto
docker compose up -d
```

### Monitorear Logs en Tiempo Real
* **Ver todos los logs:** `docker compose logs -f`
* **Ver logs únicamente del Backend:** `docker compose logs -f backend`
* **Ver logs únicamente del Frontend:** `docker compose logs -f frontend`

---

## 📁 Estructura del Código Fuente (Frontend)

* `/src/components/`: Componentes reutilizables de UI (encabezados, modales de acceso, badges visuales, pie de página).
* `/src/pages/`: Páginas principales del sitio:
  * `HomePage.jsx`: Carrusel de ofertas y categorías populares.
  * `SearchPage.jsx`: Catálogo con pestañas de filtrado (Reactivos vs. Consumibles), búsqueda de texto, ordenación y badges de envío.
  * `ProductDetailsPage.jsx`: Vista detallada de especificaciones y carga de manuales técnicos.
  * `CartPage.jsx`: Tabla del carrito de compras con la lógica del envío plano integrada.
  * `RequestQuotePage.jsx`: Formulario de solicitud de cotizaciones con auto-poblado desde el carrito.
  * `AdminPage.jsx`: Consola de administración integrada (SMTP, plantillas y formularios colapsables).
* `/src/utils/api.js`: Helper de fetches HTTP centralizado con soporte automático de CSRF.
