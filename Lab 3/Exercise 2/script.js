// ==================== PRODUCT DATA ====================
const products = [
    { id: 1, name: "Wireless Headphones", category: "Electronics", price: 79.99, stock: 15 },
    { id: 2, name: "USB-C Cable", category: "Electronics", price: 12.99, stock: 50 },
    { id: 3, name: "Coffee Maker", category: "Home & Kitchen", price: 89.99, stock: 8 },
    { id: 4, name: "Cutting Board Set", category: "Home & Kitchen", price: 34.99, stock: 20 },
    { id: 5, name: "Smartphone Case", category: "Electronics", price: 19.99, stock: 30 },
    { id: 6, name: "Dish Towels (Set of 5)", category: "Home & Kitchen", price: 24.99, stock: 25 },
    { id: 7, name: "Bluetooth Speaker", category: "Electronics", price: 59.99, stock: 12 },
    { id: 8, name: "Cookware Set", category: "Home & Kitchen", price: 149.99, stock: 5 }
];

// ==================== COUPON CODES ====================
const validCoupons = {
    "SAVE20": { discount: 0.20, type: "percentage", description: "20% off entire purchase" },
    "BULK10": { discount: 0.10, type: "percentage", description: "10% off on bulk purchases" },
    "WEEKEND": { discount: 0.15, type: "percentage", description: "15% off (weekends only)" },
    "NEWUSER": { discount: 0.05, type: "percentage", description: "5% off first purchase" }
};

// ==================== SHOPPING CART ====================
let cart = [];
let appliedCoupon = null;

// ==================== INITIALIZE APPLICATION ====================
document.addEventListener('DOMContentLoaded', function() {
    renderProducts();
    setupEventListeners();
    updateTimeInfo();
    setInterval(updateTimeInfo, 60000); // Update time info every minute
});

// ==================== RENDER PRODUCTS ====================
function renderProducts() {
    const container = document.getElementById('productsContainer');
    container.innerHTML = '';

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <h3>${product.name}</h3>
            <span class="product-category">${product.category}</span>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            <div class="product-stock">Stock: ${product.stock} units</div>
            <div class="add-to-cart-group">
                <input type="number" class="quantity-input" value="1" min="1" max="${product.stock}" data-product-id="${product.id}">
                <button class="btn btn-add" data-product-id="${product.id}">Add to Cart</button>
            </div>
        `;

        const addBtn = productCard.querySelector('.btn-add');
        const qtyInput = productCard.querySelector('.quantity-input');

        addBtn.addEventListener('click', () => {
            const quantity = parseInt(qtyInput.value);
            addToCart(product.id, quantity);
            qtyInput.value = '1';
        });

        container.appendChild(productCard);
    });
}

// ==================== ADD TO CART ====================
function addToCart(productId, quantity) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        // Update quantity if item already exists
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity <= product.stock) {
            existingItem.quantity = newQuantity;
        } else {
            alert(`Cannot add more than ${product.stock} units available.`);
            return;
        }
    } else {
        // Add new item to cart
        if (quantity <= product.stock) {
            cart.push({
                id: productId,
                name: product.name,
                category: product.category,
                price: product.price,
                quantity: quantity
            });
        } else {
            alert(`Cannot add more than ${product.stock} units available.`);
            return;
        }
    }

    updateCart();
}

// ==================== REMOVE FROM CART ====================
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
}

// ==================== UPDATE QUANTITY ====================
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    const product = products.find(p => p.id === productId);
    const newQuantity = item.quantity + change;

    if (newQuantity > 0 && newQuantity <= product.stock) {
        item.quantity = newQuantity;
        updateCart();
    } else if (newQuantity > product.stock) {
        alert(`Cannot exceed ${product.stock} units available.`);
    }
}

// ==================== RENDER CART ====================
function renderCart() {
    const cartItemsContainer = document.getElementById('cartItems');

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-message">Your cart is empty</p>';
        document.getElementById('checkoutBtn').disabled = true;
        return;
    }

    document.getElementById('checkoutBtn').disabled = false;
    cartItemsContainer.innerHTML = '';

    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-category">${item.category}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" data-product-id="${item.id}" data-action="decrease">−</button>
                <span class="qty-display">${item.quantity}</span>
                <button class="qty-btn" data-product-id="${item.id}" data-action="increase">+</button>
                <button class="btn-remove" data-product-id="${item.id}">Remove</button>
            </div>
        `;

        // Event listeners for quantity buttons
        const decreaseBtn = cartItem.querySelector('[data-action="decrease"]');
        const increaseBtn = cartItem.querySelector('[data-action="increase"]');
        const removeBtn = cartItem.querySelector('.btn-remove');

        decreaseBtn.addEventListener('click', () => updateQuantity(item.id, -1));
        increaseBtn.addEventListener('click', () => updateQuantity(item.id, 1));
        removeBtn.addEventListener('click', () => removeFromCart(item.id));

        cartItemsContainer.appendChild(cartItem);
    });
}

// ==================== CALCULATE DISCOUNTS ====================
function calculateDiscounts() {
    const subtotal = calculateSubtotal();
    let totalDiscount = 0;
    let discounts = {
        bulk: 0,
        category: 0,
        coupon: 0,
        timeBase: 0
    };
    let discountReasons = [];

    // 1. BULK DISCOUNT (5% for 5+, 10% for 10+)
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems >= 10) {
        discounts.bulk = subtotal * 0.10;
        discountReasons.push("🎉 Bulk Discount (10+ items): -$" + discounts.bulk.toFixed(2));
    } else if (totalItems >= 5) {
        discounts.bulk = subtotal * 0.05;
        discountReasons.push("📦 Bulk Discount (5+ items): -$" + discounts.bulk.toFixed(2));
    }

    // 2. CATEGORY DISCOUNT (8% Electronics, 12% Home & Kitchen)
    let categoryDiscount = 0;
    cart.forEach(item => {
        let itemDiscount = 0;
        if (item.category === "Electronics") {
            itemDiscount = (item.price * item.quantity) * 0.08;
        } else if (item.category === "Home & Kitchen") {
            itemDiscount = (item.price * item.quantity) * 0.12;
        }
        categoryDiscount += itemDiscount;
    });
    if (categoryDiscount > 0) {
        discounts.category = categoryDiscount;
        discountReasons.push("🏷️ Category Discount: -$" + categoryDiscount.toFixed(2));
    }

    // 3. TIME-BASED DISCOUNT (5% extra during 6-8 PM)
    if (isHappyHour()) {
        discounts.timeBase = subtotal * 0.05;
        discountReasons.push("⏰ Happy Hour Discount (6-8 PM): -$" + discounts.timeBase.toFixed(2));
    }

    // 4. COUPON DISCOUNT (applied after other discounts on subtotal)
    if (appliedCoupon) {
        let couponApplicable = true;

        // Validate coupon code conditions
        if (appliedCoupon.code === "BULK10" && totalItems < 5) {
            couponApplicable = false;
        } else if (appliedCoupon.code === "WEEKEND" && !isWeekend()) {
            couponApplicable = false;
        }

        if (couponApplicable && appliedCoupon.type === "percentage") {
            discounts.coupon = subtotal * appliedCoupon.discount;
            discountReasons.push(`🎟️ Coupon (${appliedCoupon.code}): -$` + discounts.coupon.toFixed(2));
        }
    }

    totalDiscount = discounts.bulk + discounts.category + discounts.timeBase + discounts.coupon;

    return {
        subtotal: subtotal,
        discounts: discounts,
        totalDiscount: totalDiscount,
        total: Math.max(0, subtotal - totalDiscount),
        reasons: discountReasons
    };
}

// ==================== CALCULATE SUBTOTAL ====================
function calculateSubtotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// ==================== UPDATE CART (RECALCULATE AND RENDER) ====================
function updateCart() {
    renderCart();
    const pricing = calculateDiscounts();

    // Update subtotal
    document.getElementById('subtotal').textContent = '$' + pricing.subtotal.toFixed(2);

    // Show/hide and update discount rows
    updateDiscountDisplay(pricing.discounts);

    // Update total
    document.getElementById('total').textContent = '$' + pricing.total.toFixed(2);

    // Update discount breakdown list
    updateDiscountReasons(pricing.reasons);
}

// ==================== UPDATE DISCOUNT DISPLAY ====================
function updateDiscountDisplay(discounts) {
    // Bulk Discount
    const bulkRow = document.getElementById('bulkDiscountRow');
    if (discounts.bulk > 0) {
        bulkRow.style.display = 'flex';
        document.getElementById('bulkDiscountAmount').textContent = '-$' + discounts.bulk.toFixed(2);
    } else {
        bulkRow.style.display = 'none';
    }

    // Category Discount
    const categoryRow = document.getElementById('categoryDiscountRow');
    if (discounts.category > 0) {
        categoryRow.style.display = 'flex';
        document.getElementById('categoryDiscountAmount').textContent = '-$' + discounts.category.toFixed(2);
    } else {
        categoryRow.style.display = 'none';
    }

    // Coupon Discount
    const couponRow = document.getElementById('couponDiscountRow');
    if (discounts.coupon > 0) {
        couponRow.style.display = 'flex';
        document.getElementById('couponDiscountAmount').textContent = '-$' + discounts.coupon.toFixed(2);
    } else {
        couponRow.style.display = 'none';
    }

    // Time-Based Discount
    const timeRow = document.getElementById('timeDiscountRow');
    if (discounts.timeBase > 0) {
        timeRow.style.display = 'flex';
        document.getElementById('timeDiscountAmount').textContent = '-$' + discounts.timeBase.toFixed(2);
    } else {
        timeRow.style.display = 'none';
    }
}

// ==================== UPDATE DISCOUNT REASONS ====================
function updateDiscountReasons(reasons) {
    const discountList = document.getElementById('discountList');

    if (reasons.length === 0) {
        discountList.innerHTML = '<li>No discounts applied yet</li>';
    } else {
        discountList.innerHTML = reasons.map(reason => `<li>${reason}</li>`).join('');
    }
}

// ==================== COUPON CODE VALIDATION ====================
function validateAndApplyCoupon() {
    const couponInput = document.getElementById('couponInput');
    const couponCode = couponInput.value.trim().toUpperCase();
    const messageDiv = document.getElementById('couponMessage');

    // Reset message
    messageDiv.className = 'message';
    messageDiv.textContent = '';

    if (!couponCode) {
        messageDiv.className = 'message error';
        messageDiv.textContent = '❌ Please enter a coupon code';
        appliedCoupon = null;
        document.getElementById('appliedCoupon').style.display = 'none';
        updateCart();
        return;
    }

    // Validate coupon code using string methods
    if (validateCouponFormat(couponCode) && couponCode in validCoupons) {
        const coupon = validCoupons[couponCode];

        // Check coupon-specific conditions
        if (couponCode === "WEEKEND" && !isWeekend()) {
            messageDiv.className = 'message error';
            messageDiv.textContent = '❌ WEEKEND coupon is only valid on weekends!';
            appliedCoupon = null;
            document.getElementById('appliedCoupon').style.display = 'none';
            updateCart();
            return;
        }

        if (couponCode === "BULK10") {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            if (totalItems < 5) {
                messageDiv.className = 'message error';
                messageDiv.textContent = '❌ BULK10 requires 5+ items in cart!';
                appliedCoupon = null;
                document.getElementById('appliedCoupon').style.display = 'none';
                updateCart();
                return;
            }
        }

        // Apply coupon
        appliedCoupon = { code: couponCode, ...coupon };
        messageDiv.className = 'message success';
        messageDiv.textContent = `✅ Coupon "${couponCode}" applied successfully! ${coupon.description}`;

        // Display applied coupon
        document.getElementById('couponName').textContent = couponCode;
        document.getElementById('couponDiscount').textContent = coupon.description;
        document.getElementById('appliedCoupon').style.display = 'block';

        couponInput.value = '';
        updateCart();
    } else {
        messageDiv.className = 'message error';
        messageDiv.textContent = '❌ Invalid coupon code. Please check and try again.';
        appliedCoupon = null;
        document.getElementById('appliedCoupon').style.display = 'none';
        updateCart();
    }
}

// ==================== VALIDATE COUPON FORMAT ====================
function validateCouponFormat(code) {
    // Using string methods to validate
    // Coupon should be alphanumeric, length between 5-20
    if (typeof code !== 'string') return false;
    if (code.length < 4 || code.length > 20) return false;

    // Check if contains only alphanumeric characters
    return /^[A-Z0-9]+$/.test(code);
}

// ==================== CHECK IF HAPPY HOUR (6-8 PM) ====================
function isHappyHour() {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 18 && hour < 20; // 6 PM to 8 PM
}

// ==================== CHECK IF WEEKEND ====================
function isWeekend() {
    const now = new Date();
    const day = now.getDay();
    return day === 0 || day === 6; // Sunday (0) or Saturday (6)
}

// ==================== UPDATE TIME INFO ====================
function updateTimeInfo() {
    const timeInfoDiv = document.getElementById('timeInfo');
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const day = now.getDay();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let message = `📅 ${days[day]} at ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    if (isHappyHour()) {
        timeInfoDiv.className = 'time-info happy-hour';
        message += ' 🎉 HAPPY HOUR! Extra 5% discount applied!';
    } else if (isWeekend()) {
        timeInfoDiv.className = 'time-info';
        message += ' 🎊 Weekend Special - WEEKEND coupon available!';
    } else {
        timeInfoDiv.className = 'time-info';
    }

    timeInfoDiv.textContent = message;

    // Recalculate if time changed happy hour status
    updateCart();
}

// ==================== SETUP EVENT LISTENERS ====================
function setupEventListeners() {
    const applyCouponBtn = document.getElementById('applyCouponBtn');
    const couponInput = document.getElementById('couponInput');
    const checkoutBtn = document.getElementById('checkoutBtn');

    applyCouponBtn.addEventListener('click', validateAndApplyCoupon);

    // Allow applying coupon with Enter key
    couponInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            validateAndApplyCoupon();
        }
    });

    // Checkout button click
    checkoutBtn.addEventListener('click', () => {
        const pricing = calculateDiscounts();
        alert(`
🛍️ Order Summary
━━━━━━━━━━━━━━━━━━━━━━━━━
Subtotal: $${pricing.subtotal.toFixed(2)}
Total Discount: -$${pricing.totalDiscount.toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━
Final Total: $${pricing.total.toFixed(2)}

Thank you for your purchase! 🎉
Items: ${cart.reduce((sum, item) => sum + item.quantity, 0)}
        `);

        // Clear cart
        cart = [];
        appliedCoupon = null;
        document.getElementById('appliedCoupon').style.display = 'none';
        document.getElementById('couponInput').value = '';
        updateCart();
    });
}
