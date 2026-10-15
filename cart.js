// Load Cart Items
function loadCart() {

    let cart = JSON.parse(localStorage.getItem("pharmora_cart")) || [];

    const cartItemsDiv = document.getElementById("cart-items");
    const subtotal = document.getElementById("subtotal");
    const total = document.getElementById("total");
    const subtitle = document.getElementById("cart-subtitle");

    cartItemsDiv.innerHTML = "";

    let totalPrice = 0;

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = "<h3>Your cart is empty</h3>";
        subtitle.innerText = "0 medicines in your cart";
        subtotal.innerText = "₹0";
        total.innerText = "₹0";
        return;
    }

    cart.forEach((item, index) => {

        totalPrice += item.price * item.qty;

        let div = document.createElement("div");
        div.className = "cart-item";

        div.innerHTML = `
            <div>
                <h3>${item.name}</h3>
                <p class="qty">Quantity: ${item.qty}</p>
            </div>

            <div>
                <p class="price">₹${item.price}</p>
                <button class="remove-btn" onclick="removeItem(${index})">
                    Remove
                </button>
            </div>
        `;

        cartItemsDiv.appendChild(div);
    });

    subtitle.innerText = cart.length + " medicines in your cart";

    subtotal.innerText = "₹" + totalPrice;
    total.innerText = "₹" + totalPrice;
}


// Remove Medicine
function removeItem(index) {

    let cart = JSON.parse(localStorage.getItem("pharmora_cart")) || [];

    cart.splice(index, 1);

    localStorage.setItem("pharmora_cart", JSON.stringify(cart));

    loadCart();
}


// Proceed to Checkout
function checkout() {

    let user = localStorage.getItem("pharmora_user");

    if (!user) {
        window.location.href = "login.html";
    } else {
        window.location.href = "checkout.html";
    }
}


// Continue Shopping
function continueShopping() {

    window.location.href = "index.html";
}


// Load cart on page open
loadCart();


function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem("pharmora_cart")) || [];

    let count = cart.reduce((sum, item) => {
        return sum + (Number(item.qty) || 1);
    }, 0);

    const cartCount = document.getElementById("cart-count");

    if (cartCount) {
        cartCount.innerText = count;
    }
}

updateCartCount();
