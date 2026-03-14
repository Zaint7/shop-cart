const API = "http://localhost:3000/api";

function formatCOP(value) {
  return "$ " + Math.round(value).toLocaleString("es-CO");
}

function showToast(msg, type = "success") {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 3000);
}

async function loadProducts() {
  const res = await fetch(API + "/products");
  const products = await res.json();
  const ul = document.getElementById("products");
  ul.innerHTML = "";

  products.forEach(p => {
    const sinStock = p.stock === 0;
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="product-name">${p.name}</span>
      <div class="product-meta">
        <span class="product-price">${formatCOP(p.price)}</span>
        <span class="product-stock ${sinStock ? 'sin-stock' : ''}">
          ${sinStock ? '⚠ Sin existencias' : 'Stock: ' + p.stock}
        </span>
      </div>
      <button class="btn-add" onclick="addToCart(${p.id})" ${sinStock ? 'disabled' : ''}>
        ${sinStock ? 'Agotado' : '+ Agregar al carrito'}
      </button>
    `;
    ul.appendChild(li);
  });
}

async function addToCart(productId) {
  const res = await fetch(API + "/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity: 1 })
  });

  const data = await res.json();

  if (!res.ok) {
    showToast(data.error, "error");
    return;
  }

  showToast("Producto agregado al carrito");
  loadCart();
  loadProducts();
}

async function loadCart() {
  const res = await fetch(API + "/cart");
  const data = await res.json();
  const ul = document.getElementById("cart");
  ul.innerHTML = "";

  if (!data.items || data.items.length === 0) {
    ul.innerHTML = '<p class="empty">Tu carrito está vacío</p>';
    document.getElementById("total").textContent = "$ 0";
    return;
  }

  data.items.forEach(item => {
    const li = document.createElement("li");
    const name = item.product ? item.product.name : "Producto #" + item.productId;
    const price = item.product ? formatCOP(item.product.price * item.quantity) : "—";
    li.innerHTML = `
      <div class="cart-item-info">
        <span class="cart-item-name">${name}</span>
        <span class="cart-item-detail">Cantidad: ${item.quantity}</span>
      </div>
      <div class="cart-item-right">
        <span class="cart-item-price">${price}</span>
        <button class="btn btn-danger" onclick="removeFromCart(${item.id})">✕</button>
      </div>
    `;
    ul.appendChild(li);
  });

  document.getElementById("total").textContent = formatCOP(data.total);
}

async function removeFromCart(id) {
  await fetch(API + "/cart/" + id, { method: "DELETE" });
  showToast("Producto eliminado");
  loadCart();
  loadProducts();
}

loadProducts();
loadCart();