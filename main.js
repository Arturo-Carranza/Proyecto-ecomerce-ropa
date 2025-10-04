    // Se establece moneda local en pesos Argentinos y función de normalización
    const $ = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
    const norm = (s) => (s || "").toString().trim().toLowerCase();

    // Clase Productos
    class Producto {
        constructor({ id, tipo, nombre, talleDisponibles, precio }) {
        this.id = id;
        this.tipo = tipo;                
        this.nombre = nombre;            
        this.talleDisponibles = talleDisponibles; 
        this.precio = precio;           
        }
    }
//Creamos clase ItemCarrito
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
//Clase Catalogo
    class Catalogo {
        constructor(productos = []) {
        this.productos = productos;
        }
        porTipo(tipo) {
        const t = norm(tipo);
        return this.productos.filter(p => norm(p.tipo) === t);
        }
        porId(id) {
        return this.productos.find(p => p.id === Number(id));
        }
        todosLosTipos() {
        return [...new Set(this.productos.map(p => p.tipo))];
        }
    }

    class Carrito {
    constructor() {
        this.items = [];
        }
        agregar(item) {
        // merge si mismo producto + talle
        const i = this.items.find(x => x.producto.id === item.producto.id && x.talle === item.talle);
        if (i) i.cantidad += item.cantidad;
        else this.items.push(item);
        }
        get cantidadTotal() {
        return this.items.reduce((acc, it) => acc + it.cantidad, 0);
        }
        get subtotal() {
        return this.items.reduce((acc, it) => acc + it.subtotal, 0);
        }
        total({ iva = 0.21, descuento = 0 } = {}) {
        const base = this.subtotal * (1 - descuento);
        return base * (1 + iva);
        }
        resumen({ iva = 0.21, descuento = 0 } = {}) {
        return {
        items: this.items.map(it => ({
            ID: it.producto.id,
            Producto: it.producto.nombre,
            Tipo: it.producto.tipo,
            Talle: it.talle,
            Cantidad: it.cantidad,
            PrecioUnit: it.producto.precio,
            Subtotal: it.subtotal
            })),
        cantidadTotal: this.cantidadTotal,
        subtotal: this.subtotal,
        descuento: descuento,
        iva: iva,
        total: this.total({ iva, descuento })
        };
    }
}

    // Productos cargados en el catalogo
    const catalogo = new Catalogo([
        
        new Producto({ id: 1,  tipo: "remera",  nombre: "Remera oversize", talleDisponibles: ["S","M","L","XL"],precio: 12900 }),
        new Producto({ id: 2, tipo: "camisa", nombre: "Camisa manga larga", talleDisponibles: ["S","M","L","XL"],precio: 21900 }),
        new Producto({ id: 3, tipo: "remera",  nombre: "Remera básica", talleDisponibles: ["S","M","L","XL"],precio: 9500 }),
        new Producto({ id: 4, tipo: "remera",  nombre: "Remera estampada",talleDisponibles: ["S","M","L","XL"],precio: 11900 }),
        new Producto({ id: 5, tipo: "pantalon",nombre: "Jean slim fit",talleDisponibles: ["S","M","L","XL"],precio: 34900 }),
        new Producto({ id: 6, tipo: "bermuda", nombre: "Bermuda cargo",talleDisponibles: ["S","M","L","XL"],precio: 25900 }),
        new Producto({ id: 7, tipo: "pantalon",nombre: "Jogger deportivo",talleDisponibles: ["S","M","L","XL"],precio: 28900 }),
        new Producto({ id: 8, tipo: "campera", nombre: "Campera rompeviento",talleDisponibles: ["S","M","L","XL"],precio: 52900 }),
        new Producto({ id: 9, tipo: "campera", nombre: "Campera de jean",talleDisponibles: ["S","M","L"],precio: 61900 }),
    ]);

    // Saludo e interacción por prompt
    (function run() {
        alert("Tienda Good-Look te da la bienvenida!!!.\n\nVamos a armar tu carrito 🛒 (usa F12 para ver la consola).");

        const carrito = new Carrito();

      // Política de precios: IVA 21%; si compras 3 o más unidades totales => 20% de descuento
        const IVA = 0.21;
        const DESCUENTO_X_CANT = (cant) => (cant >= 3 ? 0.20 : 0.0);

        let seguir = true;

        while (seguir) {
        // Pide el tipo de producto
        const tipos = catalogo.todosLosTipos();
        let tipo = prompt(`¿Qué tipo de producto querés? Opciones: ${tipos.join(", ")}\n(Escribí por ejemplo: remera)`);
        if (!tipo) break;
        tipo = norm(tipo);

        const disponibles = catalogo.porTipo(tipo);
        if (!disponibles.length) {
            alert("Tipo no válido. Probá con: " + tipos.join(", "));
            continue;
        }

       // Se muestran los productos disponibles de ese tipo y se pide el ID (reintenta hasta válido)
const lista = disponibles.map(p => `${p.id} - ${p.nombre} (${p.talleDisponibles.join("/")}) ${$(p.precio)}`).join("\n");
let prod = null;

while (true) {
const entrada = prompt(
    `Elegí el ID del producto:\n\n${lista}\n\nEscribí el ID numérico`);

  // Usuario canceló: volver al inicio del bucle principal
    if (entrada === null) {
    prod = null;
    break;
}

const id = Number(String(entrada).trim());
    if (!Number.isInteger(id)) {
    alert("Debés ingresar un ID numérico.");
    continue; // vuelve a pedir
}

  // Validar que el ID pertenezca a los 'disponibles' (garantiza que coincide el tipo)
const candidato = disponibles.find(p => p.id === id);
if (!candidato) {
    alert("ID inválido para ese tipo. Elegí uno de la lista mostrada.");
    continue; // vuelve a pedir
  }

  // ✅ válido
  prod = candidato;
  break;
}

if (prod === null) continue; // usuario canceló => vuelve al inicio

// Se pide el talle
let talle;
const opciones = prod.talleDisponibles.map(v => String(v).toUpperCase());
let entrada;

do {
    entrada = prompt(`Elegí talle para "${prod.nombre}": ${prod.talleDisponibles.join(" / ")}`);
  if (entrada === null) { talle = null; break; } // canceló
    talle = String(entrada).trim().toUpperCase();
    if (!talle) alert("No ingresaste ningún talle. Probá de nuevo.");
    else if (!opciones.includes(talle)) alert("Talle no disponible.");
}   while (!talle || !opciones.includes(talle));

if (talle === null) continue;  // si se cancela ,se vuelve al inicio



// Se pide la cantidad de productos
let cantidad = Number(prompt("¿Cuántas unidades?"));
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
        alert("Cantidad inválida.");
        continue;
        }

        //  Agregamos al carrito y mostramos el subtotal, descuento y total parcial
        carrito.agregar(new ItemCarrito(prod, talle, cantidad));
        const desc = DESCUENTO_X_CANT(carrito.cantidadTotal);
        const totalParcial = carrito.total({ iva: IVA, descuento: desc });

        alert(
            `Agregado: ${prod.nombre} x${cantidad} (talle ${talle})\n` +
            `Subtotal: ${$(carrito.subtotal)}\n` +
            `Descuento: ${(desc*100).toFixed(0)}%\n` +
            `Total con IVA: ${$(totalParcial)}`
        );

        // Se pregunta si se quiere agregar otro producto y se valida la respuesta
        const r = norm(prompt("¿Querés agregar otro producto? (s/n)"));
        seguir = r === "s" || r === "si" || r === "sí";
        }

      // Resumen final del carrito con los items seleccionados
        const descFinal = DESCUENTO_X_CANT(carrito.cantidadTotal);
        const { items, subtotal, total } = carrito.resumen({ iva: IVA, descuento: descFinal });
    // Si no hay items, se avisa y termina el proceso
        if (!items.length) {
        alert("No agregaste productos. ¡Hasta la próxima!");
        return;
        }

        console.clear();
        console.log("==== Resumen del carrito ====");
        console.table(items.map(i => ({
        ID: i.ID,
        Producto: i.Producto,
        Tipo: i.Tipo,
        Talle: i.Talle,
        Cantidad: i.Cantidad,
        "Precio Unitario": $(i.PrecioUnit),
        Subtotal: $(i.Subtotal)
        })));
        console.log("Subtotal:", $(subtotal));
        console.log("Descuento:", (descFinal * 100).toFixed(0) + "%");
        console.log("IVA:", "21%");
        console.log("TOTAL:", $(total));
// Alerta con el resumen de la compra
        alert(
        `🧾 Resumen\n` +
        `Ítems: ${items.length} | Unidades: ${items.reduce((a,i)=>a+i.Cantidad,0)}\n` +
        `Subtotal: ${$(subtotal)}\n` +
        `Descuento: ${(descFinal*100).toFixed(0)}%\n` +
        `IVA: 21%\n` +
        `TOTAL: ${$(total)}\n\n` +
        `Mirá el detalle en la consola (F12 → Console).`
    );
    })();