   // ===============================
// utilidades y clases base
// ===============================
const $ = (n) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);

const norm = (s) => (s || "").toString().trim().toLowerCase();

class Producto {
  constructor({ id, tipo, nombre, talleDisponibles, precio }) {
    this.id = id;
    this.tipo = tipo;
    this.nombre = nombre;
    this.talleDisponibles = talleDisponibles;
    this.precio = precio;
  }
}

class ItemCarrito {
  constructor(producto, talle, cantidad) {
    this.producto = producto;
    this.talle = talle;
    this.cantidad = cantidad;
  }
  get subtotal() {
    return this.producto.precio * this.cantidad;
  }
}

class Catalogo {
  constructor(productos = []) {
    this.productos = productos;
  }
  porTipo(tipo) {
    const t = norm(tipo);
    return this.productos.filter((p) => norm(p.tipo) === t);
  }
  porId(id) {
    return this.productos.find((p) => p.id === Number(id));
  }
}

class Carrito {
  constructor() {
    this.items = [];
  }

  agregar(item) {
    const i = this.items.find(
      (x) => x.producto.id === item.producto.id && x.talle === item.talle
    );
    if (i) {
      i.cantidad += item.cantidad;
    } else {
      this.items.push(item);
    }
  }

  eliminar(id, talle) {
    this.items = this.items.filter(
      (x) => !(x.producto.id === id && x.talle === talle)
    );
  }

  cambiarCantidad(id, talle, nuevaCant) {
    const i = this.items.find(
      (x) => x.producto.id === id && x.talle === talle
    );
    if (!i) return;
    i.cantidad = nuevaCant;
    if (i.cantidad <= 0) {
      this.eliminar(id, talle);
    }
  }

  get cantidadTotal() {
    return this.items.reduce((acc, it) => acc + it.cantidad, 0);
  }

  get subtotal() {
    return this.items.reduce(
      (acc, it) => acc + it.producto.precio * it.cantidad,
      0
    );
  }

  total({ iva = 0.21, descuento = 0 } = {}) {
    const base = this.subtotal * (1 - descuento);
    return base * (1 + iva);
  }

  resumen({ iva = 0.21, descuento = 0 } = {}) {
    return {
      cantidadTotal: this.cantidadTotal,
      subtotal: this.subtotal,
      descuento,
      iva,
      total: this.total({ iva, descuento }),
    };
  }
}

// ===============================
// DATA
// ===============================
const catalogo = new Catalogo([
  new Producto({
    id: 1,
    tipo: "remera",
    nombre: "Remera oversize",
    talleDisponibles: ["S", "M", "L", "XL"],
    precio: 12900,
  }),
  new Producto({
    id: 2,
    tipo: "camisa",
    nombre: "Camisa manga larga",
    talleDisponibles: ["S", "M", "L", "XL"],
    precio: 21900,
  }),
  new Producto({
    id: 3,
    tipo: "remera",
    nombre: "Remera básica",
    talleDisponibles: ["S", "M", "L", "XL"],
    precio: 9500,
  }),
  new Producto({
    id: 4,
    tipo: "remera",
    nombre: "Remera estampada",
    talleDisponibles: ["S", "M", "L", "XL"],
    precio: 11900,
  }),
  new Producto({
    id: 5,
    tipo: "pantalon",
    nombre: "Jean slim fit",
    talleDisponibles: ["S", "M", "L", "XL"],
    precio: 34900,
  }),
  new Producto({
    id: 6,
    tipo: "bermuda",
    nombre: "Bermuda cargo",
    talleDisponibles: ["S", "M", "L", "XL"],
    precio: 25900,
  }),
  new Producto({
    id: 7,
    tipo: "pantalon",
    nombre: "Jogger deportivo",
    talleDisponibles: ["S", "M", "L", "XL"],
    precio: 28900,
  }),
  new Producto({
    id: 8,
    tipo: "campera",
    nombre: "Campera rompeviento",
    talleDisponibles: ["S", "M", "L", "XL"],
    precio: 52900,
  }),
  new Producto({
    id: 9,
    tipo: "campera",
    nombre: "Campera de jean",
    talleDisponibles: ["S", "M", "L"],
    precio: 61900,
  }),
]);

const carrito = new Carrito();
const IVA = 0.21;
const DESCUENTO_X_CANT = (cant) => (cant >= 3 ? 0.2 : 0);

// ===============================
// DOM READY
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  // --- refs DOM ---
  const productosContainer = document.getElementById("productos-container");
  const filtrosWrap = document.getElementById("filtros");

  const badgeCarrito = document.getElementById("carrito-count");
  const badgeCarritoPanel = document.getElementById("carrito-count-panel");

  const panelCarrito = document.getElementById("carrito-panel");
  const abrirCarritoBtn = document.getElementById("btn-carrito");
  const cerrarCarritoBtn = document.getElementById("cerrar-carrito");

  const tablaBody = document.querySelector("#tabla-carrito tbody");

  const resumenSubtotal = document.getElementById("resumen-subtotal");
  const resumenDescuento = document.getElementById("resumen-descuento");
  const resumenIva = document.getElementById("resumen-iva");
  const resumenTotal = document.getElementById("resumen-total");

  const vaciarBtn = document.getElementById("vaciar-carrito");
  const goCheckoutBtn = document.getElementById("go-checkout");

  const secciones = document.querySelectorAll(".vista");

  // navbar responsive
  const navToggleBtn = document.getElementById("navbar-toggle");
  const navLinks = document.getElementById("nav-links");

  // checkout
  const checkoutForm = document.getElementById("checkout-form");
  const checkoutMsg = document.getElementById("checkout-msg");

  // --------------------------
  // helpers
  // --------------------------
  function switchSection(target) {
    secciones.forEach((sec) => {
      sec.classList.toggle("hidden", sec.id !== `${target}-section`);
    });
  }

  function renderProductos(lista) {
    productosContainer.innerHTML = "";

    lista.forEach((p) => {
      const tallesOptions = p.talleDisponibles
        .map((t) => `<option value="${t}">${t}</option>`)
        .join("");

      const card = document.createElement("div");
      card.className = "card-producto";

      card.innerHTML = `
        <img src="img/prod-${p.id}.jpg" alt="${p.nombre}" class="card-img">

        <div class="card-body">
          <h3 class="prod-nombre">${p.nombre}</h3>
          <div class="prod-precio">${$(p.precio)}</div>

          <div class="control-line">
            <label>Talle</label>
            <select class="select-talle">
              ${tallesOptions}
            </select>
          </div>

          <div class="control-line">
            <label>Cant.</label>
            <input class="input-cant" type="number" min="1" value="1">
          </div>

          <button class="btn-add" data-id="${p.id}">Agregar</button>
        </div>
      `;

      productosContainer.appendChild(card);
    });
  }

  function renderCarritoTabla() {
    tablaBody.innerHTML = "";

    if (carrito.items.length === 0) {
      tablaBody.innerHTML = `
        <tr>
          <td colspan="5" class="empty">Tu carrito está vacío</td>
        </tr>
      `;
      return;
    }

    carrito.items.forEach((it) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>
          <div class="carrito-name">${it.producto.nombre}</div>
          <div class="carrito-talle">Talle ${it.talle}</div>
        </td>

        <td>${$(it.producto.precio)}</td>

        <td>
          <input
            class="carrito-cant"
            type="number"
            min="1"
            value="${it.cantidad}"
            data-id="${it.producto.id}"
            data-talle="${it.talle}"
          >
        </td>

        <td>${$(it.subtotal)}</td>

        <td>
          <button
            class="btn-del"
            title="Eliminar"
            data-id="${it.producto.id}"
            data-talle="${it.talle}"
          >✕</button>
        </td>
      `;

      tablaBody.appendChild(tr);
    });
  }

  function updateCarritoUI() {
    // badges
    badgeCarrito.textContent = carrito.cantidadTotal;
    badgeCarritoPanel.textContent = carrito.cantidadTotal;

    // tabla carrito
    renderCarritoTabla();

    // totales
    const desc = DESCUENTO_X_CANT(carrito.cantidadTotal);
    const totalFinal = carrito.total({ iva: IVA, descuento: desc });

    resumenSubtotal.textContent = $(carrito.subtotal);
    resumenDescuento.textContent = (desc * 100).toFixed(0) + "%";
    resumenIva.textContent = "21%";
    resumenTotal.textContent = $(totalFinal);
  }

  // init render
  renderProductos(catalogo.productos);
  updateCarritoUI();

  // --------------------------
  // Filtros catálogo
  // --------------------------
  filtrosWrap.addEventListener("click", (e) => {
    if (!e.target.matches(".filtro-btn")) return;

    filtrosWrap.querySelectorAll(".filtro-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    e.target.classList.add("active");

    const tipo = e.target.dataset.filtro;
    if (tipo === "all") {
      renderProductos(catalogo.productos);
    } else {
      renderProductos(catalogo.porTipo(tipo));
    }
  });

  // --------------------------
  // Agregar al carrito
  // --------------------------
  productosContainer.addEventListener("click", (e) => {
    if (!e.target.matches(".btn-add")) return;

    const card = e.target.closest(".card-producto");
    const id = parseInt(e.target.dataset.id, 10);
    const producto = catalogo.porId(id);

    const talle = card.querySelector(".select-talle").value;
    const cantInput = card.querySelector(".input-cant");
    const cantidad = parseInt(cantInput.value, 10);

    if (!cantidad || cantidad <= 0) {
      alert("Cantidad inválida.");
      return;
    }

    carrito.agregar(new ItemCarrito(producto, talle, cantidad));
    updateCarritoUI();
  });

  // --------------------------
  // Eventos panel carrito
  // --------------------------
  panelCarrito.addEventListener("input", (e) => {
    if (!e.target.matches(".carrito-cant")) return;
    const id = parseInt(e.target.dataset.id, 10);
    const talle = e.target.dataset.talle;
    const nuevaCant = parseInt(e.target.value, 10);

    carrito.cambiarCantidad(id, talle, nuevaCant);
    updateCarritoUI();
  });

  panelCarrito.addEventListener("click", (e) => {
    if (e.target.matches(".btn-del")) {
      const id = parseInt(e.target.dataset.id, 10);
      const talle = e.target.dataset.talle;
      carrito.eliminar(id, talle);
      updateCarritoUI();
    }
  });

  vaciarBtn.addEventListener("click", () => {
    carrito.items = [];
    updateCarritoUI();
  });

  // --------------------------
  // Abrir / cerrar carrito
  // --------------------------
  abrirCarritoBtn.addEventListener("click", () => {
    panelCarrito.classList.add("open");
  });

  cerrarCarritoBtn.addEventListener("click", () => {
    panelCarrito.classList.remove("open");
  });

  // --------------------------
  // Navbar hamburguesa (mobile)
  // --------------------------
  navToggleBtn.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });

  // --------------------------
  // Navegación SPA (Inicio / Catálogo / Checkout)
  // También cierra menú móvil y carrito cuando corresponde
  // --------------------------
  document.addEventListener("click", (e) => {
    const navClick = e.target.closest("[data-section]");
    if (!navClick) return;

    e.preventDefault();

    const target = navClick.dataset.section;
    switchSection(target);

    // cerrar panel carrito si voy a checkout
    if (navClick.id === "go-checkout") {
      panelCarrito.classList.remove("open");
    }

    // cerrar menú móvil después de click
    navLinks.classList.remove("open");
  });

  // --------------------------
  // Checkout submit
  // --------------------------
  checkoutForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (carrito.items.length === 0) {
      checkoutMsg.textContent = "Tu carrito está vacío.";
      checkoutMsg.style.color = "var(--danger)";
      return;
    }

    const nombre = document.getElementById("nombre").value.trim();

    checkoutMsg.textContent =
      "Gracias " +
      nombre +
      "! Tu pedido fue registrado. Te vamos a contactar para coordinar pago y envío.";
    checkoutMsg.style.color = "var(--success)";

    carrito.items = [];
    updateCarritoUI();
    checkoutForm.reset();
  });
});