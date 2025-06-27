 // Sample maid/service person data for dynamic assignment
        const servicePersons = [
            { id: 1, name: 'Nancy Singh', speciality: 'House Cleaning' },
            { id: 2, name: 'Priya Sharma', speciality: 'Cook/Chef' },
            { id: 3, name: 'Sunita Devi', speciality: 'Baby Sitting' },
            { id: 4, name: 'Meera Gupta', speciality: 'Elderly Care' },
            { id: 5, name: 'Kavita Rani', speciality: 'Laundry/Iron' },
            { id: 6, name: 'Asha Kumari', speciality: 'Gardening' },
            { id: 7, name: 'Rekha Singh', speciality: 'Pet Care' },
            { id: 8, name: 'Geeta Devi', speciality: 'Grocery Shopping' }
        ];

        // Fetch and display orders when the page loads
        window.addEventListener('DOMContentLoaded', fetchOrders);

        async function fetchOrders() {
            try {
                const response = await fetch('/api/admin/orders');
                
                if (response.ok) {
                    const orders = await response.json();
                    displayOrders(orders);
                } else {
                    // Fallback with sample data for demonstration
                    displaySampleOrders();
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
                // Show sample data when API is not available
                displaySampleOrders();
            }
        }

        function displayOrders(orders) {
            const tableBody = document.getElementById('ordersTableBody');
            tableBody.innerHTML = '';

            if (orders.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="10" style="text-align: center; padding: 40px; color: #718096;">
                            <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                            <div>No orders found</div>
                        </td>
                    </tr>
                `;
                return;
            }

            orders.forEach((order, index) => {
                // Dynamically assign service person based on service type or randomly
                const servicePerson = getServicePersonForOrder(order);
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${index + 1}</strong></td>

                    <td>
                        <div style="font-weight: 500;">${order.name || order.customer_name || 'N/A'}</div>
                        ${order.email ? `<small style="color: #718096;">${order.email}</small>` : ''}
                    </td>
                    
                    <td>
                        <i class="fas fa-calendar-alt" style="color: #667eea; margin-right: 5px;"></i>
                        ${formatDate(order.date)}
                    </td>
                    <td>
                        <span style="background: #f0fff4; color: #10b981; padding: 4px 8px; border-radius: 6px; font-size: 12px;">
                            ${order.days || 1} day${(order.days || 1) > 1 ? 's' : ''}
                        </span>
                    </td>
                    <td>
                        <span style="background: #fff7ed; color: #ea580c; padding: 4px 8px; border-radius: 6px; font-size: 12px;">
                            ${order.hours || 8} hrs
                        </span>
                    </td>
                    <td>
                        <button class="action-btn view-btn" onclick="viewDetails('${order._id || order.id}', ${JSON.stringify(order).replace(/"/g, '&quot;')})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                    <td>
                        <span class="status-badge status-${(order.status || 'pending').toLowerCase()}">
                            ${order.status || 'Pending'}
                        </span>
                    </td>
                    <td>
                        ${(order.status || 'Pending') === 'Pending' ? `
                            <button class="action-btn accept-btn" onclick="updateOrderStatus('${order._id || order.id}', 'Accepted')">
                                <i class="fas fa-check"></i> Accept
                            </button>
                            <button class="action-btn reject-btn" onclick="updateOrderStatus('${order._id || order.id}', 'Rejected')">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        ` : '<span style="color: #718096; font-style: italic;">No actions</span>'}
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }

        function displaySampleOrders() {
            // Sample data for demonstration when API is not available
            const sampleOrders = [
                {
                    id: 1,
                    name: 'John Doe',
                    email: 'john@example.com',
                    service_name: 'House Cleaning',
                    date: '2024-01-15',
                    days: 2,
                    hours: 6,
                    status: 'Pending'
                },
                {
                    id: 2,
                    name: 'Jane Smith',
                    email: 'jane@example.com',
                    service_name: 'Cook/Chef',
                    date: '2024-01-16',
                    days: 1,
                    hours: 8,
                    status: 'Accepted'
                },
                {
                    id: 3,
                    name: 'Mike Johnson',
                    email: 'mike@example.com',
                    service_name: 'Baby Sitting',
                    date: '2024-01-17',
                    days: 1,
                    hours: 4,
                    status: 'Rejected'
                }
            ];
            
            displayOrders(sampleOrders);
        }

        function getServicePersonForOrder(order) {
            // Get service person based on service type
            const serviceName = order.service_name || order.service || '';
            
            // Find matching service person by speciality
            let servicePerson = servicePersons.find(person => 
                serviceName.toLowerCase().includes(person.speciality.toLowerCase().split('/')[0])
            );
            
            // If no match found, assign randomly but consistently based on order ID
            if (!servicePerson) {
                const orderHash = (order._id || order.id || order.name || '').length;
                const index = orderHash % servicePersons.length;
                servicePerson = servicePersons[index];
            }
            
            return servicePerson;
        }

        function formatDate(dateString) {
            if (!dateString) return 'N/A';
            
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            } catch (error) {
                return dateString;
            }
        }

        async function updateOrderStatus(orderId, status) {
            try {
                const response = await fetch(`/api/admin/orders/${orderId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status }),
                });

                if (response.ok) {
                    // Show success message
                    showNotification(`Order ${status.toLowerCase()} successfully!`, 'success');
                    // Refresh the orders list
                    setTimeout(fetchOrders, 1000);
                } else {
                    showNotification('Error updating order status', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Error updating order status', 'error');
            }
        }

        function viewDetails(orderId, orderData) {
            // Create a modal or detailed view
            const order = typeof orderData === 'string' ? JSON.parse(orderData.replace(/&quot;/g, '"')) : orderData;
            
            alert(`Order Details:
            
Order ID: ${orderId}
Customer: ${order.name || 'N/A'}
Date: ${formatDate(order.date)}
Duration: ${order.days || 1} day(s), ${order.hours || 8} hours
Status: ${order.status || 'Pending'}
            
${order.email ? `Email: ${order.email}` : ''}
${order.phone ? `Phone: ${order.phone}` : ''}
${order.address ? `Address: ${order.address}` : ''}`);
        }

        function showNotification(message, type) {
            // Create a simple notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 9999;
                animation: slideInRight 0.3s ease-out;
                ${type === 'success' ? 'background: linear-gradient(135deg, #10b981, #34d399);' : 'background: linear-gradient(135deg, #ef4444, #f87171);'}
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }

        // Toggle sidebar for mobile
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('open');
        }

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(event) {
            const sidebar = document.getElementById('sidebar');
            const menuBtn = document.querySelector('.mobile-menu-btn');
            
            if (window.innerWidth <= 768 && 
                !sidebar.contains(event.target) && 
                !menuBtn.contains(event.target)) {
                sidebar.classList.remove('open');
            }
        });

        // Handle window resize
        window.addEventListener('resize', function() {
            const sidebar = document.getElementById('sidebar');
            if (window.innerWidth > 768) {
                sidebar.classList.remove('open');
            }
        });

        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);