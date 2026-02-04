// Configuration
const API_URL = 'https://api.escuelajs.co/api/v1/products';

// State Management
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let pageSize = 10;
let sortConfig = { key: 'id', direction: 'asc' };

// DOM Elements
const productTableBody = document.getElementById('productTableBody');
const searchInput = document.getElementById('searchInput');
const pageSizeSelect = document.getElementById('pageSizeSelect');
const paginationInfo = document.getElementById('paginationInfo');
const paginationUl = document.getElementById('pagination');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const descriptionTooltip = document.getElementById('descriptionTooltip');

// Modals
const productDetailModal = new bootstrap.Modal(document.getElementById('productDetailModal'));
const createProductModal = new bootstrap.Modal(document.getElementById('createProductModal'));

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    setupEventListeners();
    updateSortIcons();
});

function updateSortIcons() {
    document.querySelectorAll('.sortable').forEach(th => {
        const key = th.dataset.sort;
        const icon = th.querySelector('.sort-icon');
        if (sortConfig.key === key) {
            th.classList.add('active');
            icon.className = `fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'} sort-icon`;
        } else {
            th.classList.remove('active');
            icon.className = 'fas fa-sort sort-icon';
        }
    });
}

// 1. Fetch Products
async function fetchProducts() {
    try {
        const response = await fetch(API_URL);
        allProducts = await response.json();
        filteredProducts = [...allProducts];
        renderDashboard();
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        alert('Không thể tải dữ liệu sản phẩm!');
    }
}

// 2. Setup Event Listeners
function setupEventListeners() {
    // Search with onChanged (real-time input)
    searchInput.addEventListener('input', () => {
        handleSearch();
    });

    // Page Size Change
    pageSizeSelect.addEventListener('change', (e) => {
        pageSize = parseInt(e.target.value);
        currentPage = 1;
        renderDashboard();
    });

    // Sorting
    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const key = th.dataset.sort;
            handleSort(key);
        });
    });

    // Export CSV
    exportCsvBtn.addEventListener('click', exportToCsv);

    // Create Product
    document.getElementById('confirmCreateBtn').addEventListener('click', createProduct);

    // Save Edit
    document.getElementById('saveEditBtn').addEventListener('click', updateProduct);

    // Switch between View and Edit mode
    document.getElementById('switchToEditBtn').addEventListener('click', toggleEditMode);
    document.getElementById('cancelEditBtn').addEventListener('click', toggleEditMode);
}

function toggleEditMode() {
    const viewMode = document.getElementById('viewMode');
    const editForm = document.getElementById('editProductForm');
    const switchBtn = document.getElementById('switchToEditBtn');
    const saveBtn = document.getElementById('saveEditBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');

    viewMode.classList.toggle('d-none');
    editForm.classList.toggle('d-none');
    switchBtn.classList.toggle('d-none');
    saveBtn.classList.toggle('d-none');
    cancelBtn.classList.toggle('d-none');
}

// 3. Search Logic
function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();
    filteredProducts = allProducts.filter(product => 
        product.title.toLowerCase().includes(query)
    );
    currentPage = 1;
    renderDashboard();
}

// 4. Sort Logic
function handleSort(key) {
    if (sortConfig.key === key) {
        sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortConfig.key = key;
        sortConfig.direction = 'asc';
    }

    updateSortIcons();

    filteredProducts.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    renderDashboard();
}

// 5. Render Dashboard
function renderDashboard() {
    renderTable();
    renderPagination();
}

function renderTable() {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageData = filteredProducts.slice(start, end);

    productTableBody.innerHTML = '';

    pageData.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.title}</td>
            <td>$${product.price}</td>
            <td>${product.category?.name || 'N/A'}</td>
            <td>
                <img src="${product.images[0] || ''}" class="product-image" alt="${product.title}" 
                     onerror="this.onerror=null;this.src='https://placehold.co/50x50?text=No+Image'">
            </td>
        `;

        // Hover for description
        row.addEventListener('mouseenter', (e) => showDescription(e, product.description));
        row.addEventListener('mousemove', moveDescription);
        row.addEventListener('mouseleave', hideDescription);

        // Click to view detail
        row.addEventListener('click', () => showProductDetail(product));

        productTableBody.appendChild(row);
    });

    paginationInfo.innerText = `Hiển thị ${Math.min(start + 1, filteredProducts.length)} đến ${Math.min(end, filteredProducts.length)} trong tổng số ${filteredProducts.length} sản phẩm`;
}

// 6. Pagination Logic
function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    paginationUl.innerHTML = '';

    // Previous Button
    const prevLi = createPaginationItem('Trước', currentPage > 1, () => {
        currentPage--;
        renderDashboard();
    });
    paginationUl.appendChild(prevLi);

    // Page Numbers (Limit visible pages)
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
        const li = createPaginationItem(i, true, () => {
            currentPage = i;
            renderDashboard();
        });
        if (i === currentPage) li.classList.add('active');
        paginationUl.appendChild(li);
    }

    // Next Button
    const nextLi = createPaginationItem('Sau', currentPage < totalPages, () => {
        currentPage++;
        renderDashboard();
    });
    paginationUl.appendChild(nextLi);
}

function createPaginationItem(text, enabled, onClick) {
    const li = document.createElement('li');
    li.className = `page-item ${enabled ? '' : 'disabled'}`;
    const a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';
    a.innerText = text;
    if (enabled) {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            onClick();
        });
    }
    li.appendChild(a);
    return li;
}

// 7. Hover Description Handlers
function showDescription(e, description) {
    if (!description) return;
    descriptionTooltip.innerText = description;
    descriptionTooltip.style.display = 'block';
    moveDescription(e);
}

function moveDescription(e) {
    const tooltipWidth = descriptionTooltip.offsetWidth;
    const tooltipHeight = descriptionTooltip.offsetHeight;
    const padding = 20;

    let left = e.pageX + 15;
    let top = e.pageY + 15;

    // Kiểm tra tràn lề phải
    if (left + tooltipWidth > window.innerWidth + window.scrollX - padding) {
        left = e.pageX - tooltipWidth - 15;
    }

    // Kiểm tra tràn lề dưới
    if (top + tooltipHeight > window.innerHeight + window.scrollY - padding) {
        top = e.pageY - tooltipHeight - 15;
    }

    descriptionTooltip.style.left = left + 'px';
    descriptionTooltip.style.top = top + 'px';
}

function hideDescription() {
    descriptionTooltip.style.display = 'none';
}

// 8. CSV Export
function exportToCsv() {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageData = filteredProducts.slice(start, end);

    if (pageData.length === 0) {
        alert('Không có dữ liệu để xuất!');
        return;
    }

    // Tiêu đề cột
    const headers = ['ID', 'Tiêu đề', 'Giá ($)', 'Danh mục', 'Mô tả'];
    
    // Sử dụng dấu chấm phẩy (;) làm dấu ngăn cách vì Excel ở một số vùng (như Việt Nam) 
    // mặc định dùng dấu này để tách cột thay vì dấu phẩy.
    const delimiter = ';';

    // Chuyển dữ liệu thành các dòng CSV
    const csvRows = pageData.map(p => {
        return [
            p.id,
            `"${p.title.replace(/"/g, '""')}"`,
            p.price,
            `"${(p.category?.name || 'N/A').replace(/"/g, '""')}"`,
            `"${(p.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
        ].join(delimiter);
    });

    // Thêm BOM (Byte Order Mark) để Excel nhận diện đúng UTF-8 
    // và nối các hàng bằng dấu chấm phẩy
    const csvContent = "\uFEFF" + headers.join(delimiter) + "\n" + csvRows.join("\n");

    // Tạo Blob và tải về
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, `products_page_${currentPage}.csv`);
    } else {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `products_page_${currentPage}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// 9. View Detail & Edit
function showProductDetail(product) {
    // Reset mode to View
    document.getElementById('viewMode').classList.remove('d-none');
    document.getElementById('editProductForm').classList.add('d-none');
    document.getElementById('switchToEditBtn').classList.remove('d-none');
    document.getElementById('saveEditBtn').classList.add('d-none');
    document.getElementById('cancelEditBtn').classList.add('d-none');

    // Fill View Mode
    document.getElementById('viewProductImg').src = product.images[0] || 'https://placehold.co/300x300?text=No+Image';
    document.getElementById('viewProductTitle').innerText = product.title;
    document.getElementById('viewProductPrice').innerText = `$${product.price}`;
    document.getElementById('viewProductCategory').innerText = product.category?.name || 'N/A';
    document.getElementById('viewProductDescription').innerText = product.description;

    const viewImgContainer = document.getElementById('viewProductImages');
    viewImgContainer.innerHTML = product.images.map(img => 
        `<img src="${img}" class="img-thumbnail" style="width: 60px; height: 60px; object-fit: cover;" 
              onerror="this.onerror=null;this.src='https://placehold.co/60x60?text=Error'">`
    ).join('');

    // Fill Edit Form
    document.getElementById('editProductId').value = product.id;
    document.getElementById('editTitle').value = product.title;
    document.getElementById('editPrice').value = product.price;
    document.getElementById('editDescription').value = product.description;
    document.getElementById('editImage').value = product.images.join(', ');

    productDetailModal.show();
}

async function updateProduct() {
    const id = document.getElementById('editProductId').value;
    const imagesStr = document.getElementById('editImage').value;
    const imagesArray = imagesStr.split(',').map(img => img.trim()).filter(img => img !== '');

    const data = {
        title: document.getElementById('editTitle').value,
        price: parseFloat(document.getElementById('editPrice').value),
        description: document.getElementById('editDescription').value,
        images: imagesArray
    };

    const saveBtn = document.getElementById('saveEditBtn');
    const originalText = saveBtn.innerText;
    saveBtn.disabled = true;
    saveBtn.innerText = 'Đang lưu...';

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const updatedProduct = await response.json();
            const index = allProducts.findIndex(p => p.id == id);
            if (index !== -1) {
                // Keep the original category if API doesn't return it
                const category = allProducts[index].category;
                allProducts[index] = { ...allProducts[index], ...updatedProduct, category };
                handleSearch();
            }
            productDetailModal.hide();
            alert('Cập nhật thành công!');
        } else {
            alert('Lỗi khi cập nhật sản phẩm!');
        }
    } catch (error) {
        console.error('Update error:', error);
        alert('Đã xảy ra lỗi khi kết nối API!');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = originalText;
    }
}

// 10. Create Product
async function createProduct() {
    const title = document.getElementById('createTitle').value;
    const price = parseFloat(document.getElementById('createPrice').value);
    const description = document.getElementById('createDescription').value;
    const categoryId = parseInt(document.getElementById('createCategoryId').value);
    const imagesStr = document.getElementById('createImages').value;
    
    // Xử lý images input linh hoạt (chấp nhận cả JSON array và danh sách dấu phẩy)
    let images = [];
    try {
        if (imagesStr.trim().startsWith('[')) {
            images = JSON.parse(imagesStr);
        } else {
            images = imagesStr.split(',').map(img => img.trim()).filter(img => img !== '');
        }
    } catch (e) {
        alert('Định dạng hình ảnh không hợp lệ! Hãy nhập URL hoặc một mảng JSON.');
        return;
    }

    if (!title || isNaN(price) || !description || isNaN(categoryId) || images.length === 0) {
        alert('Vui lòng nhập đầy đủ thông tin hợp lệ!');
        return;
    }

    const data = { title, price, description, categoryId, images };

    const confirmBtn = document.getElementById('confirmCreateBtn');
    const originalText = confirmBtn.innerText;
    confirmBtn.disabled = true;
    confirmBtn.innerText = 'Đang tạo...';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const newProduct = await response.json();
            // Fetch category info manually if missing (API often doesn't return full object on POST)
            if (!newProduct.category) {
                newProduct.category = { id: categoryId, name: 'Sản phẩm mới' };
            }
            allProducts.unshift(newProduct);
            handleSearch();
            createProductModal.hide();
            document.getElementById('createProductForm').reset();
            alert('Tạo sản phẩm thành công!');
        } else {
            const errData = await response.json();
            alert(`Lỗi khi tạo sản phẩm: ${errData.message || 'Dữ liệu không hợp lệ'}`);
        }
    } catch (error) {
        console.error('Create error:', error);
        alert('Đã xảy ra lỗi khi kết nối API!');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerText = originalText;
    }
}
