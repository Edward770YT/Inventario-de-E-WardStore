const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxP3c-NLwncToqDFitey0iNITpsVZULYZKeGrI_-UVDkkLZqHWKlcEqss39Jd-cAPcG/exec'; // Reemplaza con la URL de tu Google Apps Script desplegado

let pedidos = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, attaching listeners');
    loadPedidos();
    
    const form = document.getElementById('pedido-form');
    console.log('Form element:', form);
    form.addEventListener('submit', (e) => {
        console.log('Submit event triggered');
        handleSubmit(e);
    });
    
    document.getElementById('cancel-btn').addEventListener('click', cancelEdit);
    document.getElementById('filter-btn').addEventListener('click', filterPedidos);
    document.getElementById('export-pdf-btn').addEventListener('click', exportToPDF);
});

async function loadPedidos() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        pedidos = data.slice(1); // Omitir headers
        renderTable(pedidos);
    } catch (error) {
        console.error('Error loading pedidos:', error);
        alert('Error al cargar pedidos');
    }
}

function renderTable(data) {
    const tbody = document.getElementById('pedidos-tbody');
    tbody.innerHTML = '';
    data.forEach((pedido, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${pedido[0]}</td>
            <td>${pedido[1]}</td>
            <td>${pedido[2]}</td>
            <td>${pedido[3]}</td>
            <td>${pedido[4]}</td>
            <td>${pedido[5]}</td>
            <td>${pedido[6]}</td>
            <td>${pedido[7]}</td>
            <td>${pedido[8]}</td>
            <td>${pedido[9]}</td>
            <td>
                <button onclick="editPedido(${index})">Editar</button>
                <button onclick="deletePedido(${index})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    console.log('Form data:', Object.fromEntries(formData));
    const cantidadStr = formData.get('cantidad').trim();
    const precioStr = formData.get('precio').trim();
    const cantidad = parseInt(cantidadStr);
    const precio = parseFloat(precioStr);
    if (isNaN(cantidad) || cantidad <= 0) {
        alert('Cantidad debe ser un número positivo. Valor recibido: "' + cantidadStr + '"');
        return;
    }
    if (isNaN(precio) || precio <= 0) {
        alert('Precio debe ser un número positivo. Valor recibido: "' + precioStr + '"');
        return;
    }
    const pedido = {
        fecha: formData.get('fecha'),
        nombre: formData.get('nombre'),
        telefono: formData.get('telefono'),
        producto: formData.get('producto'),
        codigo: formData.get('codigo'),
        color: formData.get('color'),
        cantidad: cantidad,
        precio: precio,
        total: cantidad * precio,
        estado: formData.get('estado')
    };
    
    const rowId = document.getElementById('row-id').value;
    if (rowId) {
        updatePedido(rowId, pedido);
    } else {
        addPedido(pedido);
    }
}

async function addPedido(pedido) {
    try {
        console.log('Enviando pedido:', pedido);
        const url = `${SCRIPT_URL}?action=add&data=${encodeURIComponent(JSON.stringify(pedido))}`;
        const response = await fetch(url);
        console.log('Respuesta del servidor:', response);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log('Resultado:', result);
        loadPedidos();
        document.getElementById('pedido-form').reset();
    } catch (error) {
        console.error('Error adding pedido:', error);
        alert('Error al agregar pedido: ' + error.message);
    }
}

async function updatePedido(index, pedido) {
    try {
        console.log('Actualizando pedido en índice:', index, pedido);
        const url = `${SCRIPT_URL}?action=update&index=${index}&data=${encodeURIComponent(JSON.stringify(pedido))}`;
        const response = await fetch(url);
        console.log('Respuesta del servidor:', response);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log('Resultado:', result);
        loadPedidos();
        cancelEdit();
    } catch (error) {
        console.error('Error updating pedido:', error);
        alert('Error al actualizar pedido: ' + error.message);
    }
}

async function deletePedido(index) {
    if (confirm('¿Estás seguro de eliminar este pedido?')) {
        try {
            console.log('Eliminando pedido en índice:', index);
            const url = `${SCRIPT_URL}?action=delete&index=${index}`;
            const response = await fetch(url);
            console.log('Respuesta del servidor:', response);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            console.log('Resultado:', result);
            loadPedidos();
        } catch (error) {
            console.error('Error deleting pedido:', error);
            alert('Error al eliminar pedido: ' + error.message);
        }
    }
}

function editPedido(index) {
    const pedido = pedidos[index];
    document.getElementById('row-id').value = index;
    document.getElementById('fecha').value = pedido[0];
    document.getElementById('nombre').value = pedido[1];
    document.getElementById('telefono').value = pedido[2];
    document.getElementById('producto').value = pedido[3];
    document.getElementById('codigo').value = pedido[4];
    document.getElementById('color').value = pedido[5];
    document.getElementById('cantidad').value = pedido[6];
    document.getElementById('precio').value = pedido[7];
    document.getElementById('estado').value = pedido[9];
    document.getElementById('form-section').scrollIntoView();
}

function cancelEdit() {
    document.getElementById('pedido-form').reset();
    document.getElementById('row-id').value = '';
}

function filterPedidos() {
    const desde = document.getElementById('filter-fecha-desde').value;
    const hasta = document.getElementById('filter-fecha-hasta').value;
    const search = document.getElementById('search-nombre').value.toLowerCase();
    let filtered = pedidos;
    if (desde) {
        filtered = filtered.filter(p => p[0] >= desde);
    }
    if (hasta) {
        filtered = filtered.filter(p => p[0] <= hasta);
    }
    if (search) {
        filtered = filtered.filter(p => p[1].toLowerCase().includes(search));
    }
    renderTable(filtered);
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const desde = document.getElementById('filter-fecha-desde').value;
    const hasta = document.getElementById('filter-fecha-hasta').value;
    const search = document.getElementById('search-nombre').value.toLowerCase();
    let data = pedidos;
    if (desde || hasta || search) {
        data = pedidos.filter(p => {
            const fecha = p[0];
            const nombre = p[1].toLowerCase();
            return (!desde || fecha >= desde) && (!hasta || fecha <= hasta) && (!search || nombre.includes(search));
        });
    }
    
    const tableData = data.map(p => [
        p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8], p[9]
    ]);
    
    const total = data.reduce((sum, p) => sum + parseFloat(p[8]), 0);
    
    doc.text('Reporte de Pedidos', 14, 20);
    let y = 30;
    if (desde || hasta) {
        doc.text(`Desde: ${desde || 'N/A'} Hasta: ${hasta || 'N/A'}`, 14, y);
        y += 10;
    }
    if (search) {
        doc.text(`Búsqueda: ${document.getElementById('search-nombre').value}`, 14, y);
        y += 10;
    }
    
    doc.autoTable({
        head: [['Fecha', 'Nombre y Apellido', 'Teléfono', 'Producto', 'Código', 'Color/Modelo', 'Cantidad', 'Precio Unitario', 'Total', 'Estado']],
        body: tableData,
        startY: y
    });
    
    const finalY = doc.lastAutoTable.finalY;
    doc.text(`Gran Total: ${total.toFixed(2)}`, 14, finalY + 10);
    
    doc.save('reporte_pedidos.pdf');
}