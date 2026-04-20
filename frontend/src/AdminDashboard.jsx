import React, { useState, useEffect, useCallback } from 'react';
import { useProducts } from './hooks/useProducts';
import { useOrders } from './hooks/useOrders';
import { apiClient } from './api/apiClient';
import StatisticsDashboard from './StatisticsDashboard';

const CATEGORIES = ['', '전자제품', '의류', '식품', '스포츠/레저', '뷰티', '도서', '가구/인테리어', '기타'];
const EMPTY_FORM = { name: '', price: 0, stockQuantity: 0, description: '', imageUrl: '', category: '' };

const ORDER_STATUS_LABEL = {
    ORDERED:   '주문 완료',
    PAID:      '결제 완료',
    SHIPPING:  '배송 중',
    DELIVERED: '배송 완료',
    CANCELED:  '결제 취소',
};

const inputStyle = {
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    background: '#fff',
    color: '#333',
    width: '100%',
    boxSizing: 'border-box',
};

const AdminDashboard = ({ role, onProductChanged }) => {
    const { createProduct, updateProduct, fetchProducts } = useProducts();
    const { fetchAllOrdersAdmin, deliverOrder } = useOrders(null, 0);

    const [activeTab, setActiveTab] = useState('products');
    const [productList, setProductList] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [listError, setListError] = useState(null);

    const [orderList, setOrderList] = useState([]);
    const [orderLoading, setOrderLoading] = useState(false);
    const [orderError, setOrderError] = useState(null);

    const [createForm, setCreateForm] = useState(EMPTY_FORM);
    const [createFile, setCreateFile] = useState(null);
    const [createMsg, setCreateMsg] = useState(null);

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState(EMPTY_FORM);
    const [editFile, setEditFile] = useState(null);
    const [editMsg, setEditMsg] = useState(null);

    const loadProducts = useCallback(async () => {
        setListLoading(true);
        setListError(null);
        try {
            const data = await apiClient.get('/admin/products');
            setProductList(data ?? []);
        } catch (err) {
            setListError(err.message ?? '상품 목록 로드 실패');
        } finally {
            setListLoading(false);
        }
    }, []);

    const loadOrders = useCallback(async () => {
        setOrderLoading(true);
        setOrderError(null);
        try {
            const data = await fetchAllOrdersAdmin();
            setOrderList(data ?? []);
        } catch (err) {
            setOrderError(err.message ?? '주문 목록 로드 실패');
        } finally {
            setOrderLoading(false);
        }
    }, [fetchAllOrdersAdmin]);

    useEffect(() => {
        if (role === 'ROLE_ADMIN') loadProducts();
    }, [role, loadProducts]);

    useEffect(() => {
        if (role === 'ROLE_ADMIN' && activeTab === 'orders') loadOrders();
    }, [role, activeTab, loadOrders]);

    const handleDeliver = async (orderId) => {
        if (!window.confirm('해당 주문을 배송 완료 처리하시겠습니까?')) return;
        try {
            await deliverOrder(orderId);
            setOrderList(prev => prev.map(o => o.id === orderId ? { ...o, status: 'DELIVERED' } : o));
        } catch (err) {
            alert(err.message || '처리 실패');
        }
    };

    if (role !== 'ROLE_ADMIN') {
        return (
            <div style={{ padding: '20px', background: '#ffeeba', borderRadius: '8px', color: '#856404', marginBottom: '20px' }}>
                관리자만 접근할 수 있습니다.
            </div>
        );
    }

    const handleCreateChange = (e) => {
        const { name, value } = e.target;
        setCreateForm(prev => ({
            ...prev,
            [name]: name === 'price' || name === 'stockQuantity' ? Number(value) : value,
        }));
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setCreateMsg(null);
        try {
            await createProduct(createForm, createFile);
            setCreateMsg({ type: 'success', text: '등록 완료' });
            setCreateForm(EMPTY_FORM);
            setCreateFile(null);
            const fi = document.getElementById('createFileInput');
            if (fi) fi.value = '';
            await loadProducts();
            onProductChanged?.();
        } catch (err) {
            setCreateMsg({ type: 'error', text: err.message });
        }
    };

    const startEdit = (product) => {
        setEditingId(product.id);
        setEditForm({
            name: product.name,
            price: product.price,
            stockQuantity: product.stockQuantity,
            description: product.description ?? '',
            imageUrl: product.imageUrl ?? '',
            category: product.category ?? '',
        });
        setEditFile(null);
        setEditMsg(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditMsg(null);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: name === 'price' || name === 'stockQuantity' ? Number(value) : value,
        }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditMsg(null);
        try {
            await updateProduct(editingId, editForm, editFile);
            setEditMsg({ type: 'success', text: '수정 완료' });
            setEditingId(null);
            await loadProducts();
            onProductChanged?.();
        } catch (err) {
            setEditMsg({ type: 'error', text: err.message });
        }
    };

    const handleDelete = async (productId) => {
        if (!window.confirm('이 상품을 삭제하시겠습니까? 이미지 파일도 함께 삭제됩니다.')) return;
        try {
            await apiClient.delete(`/admin/products/${productId}`);
            await loadProducts();
            onProductChanged?.();
        } catch (err) {
            alert(err.message || '삭제 실패');
        }
    };

    return (
        <div style={{ color: '#333' }}>
            <h2 style={{ marginBottom: '15px', borderBottom: '2px solid #dee2e6', paddingBottom: '10px' }}>관리자 대시보드</h2>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <button onClick={() => setActiveTab('products')} style={activeTab === 'products' ? activeTabBtnStyle : tabBtnStyle}>상품 관리</button>
                <button onClick={() => setActiveTab('orders')} style={activeTab === 'orders' ? activeTabBtnStyle : tabBtnStyle}>주문 관리</button>
                <button onClick={() => setActiveTab('statistics')} style={activeTab === 'statistics' ? activeTabBtnStyle : tabBtnStyle}>매출 통계</button>
            </div>

            {activeTab === 'orders' && (
                <div>
                    <h3 style={{ marginBottom: '15px' }}>전체 주문 목록</h3>
                    {orderError && <div style={{ color: '#dc3545', marginBottom: '10px' }}>{orderError}</div>}
                    {orderLoading ? (
                        <p>주문을 불러오는 중...</p>
                    ) : orderList.length === 0 ? (
                        <p style={{ color: '#666' }}>주문 내역이 없습니다.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {orderList.map(order => (
                                <div key={order.id} style={{ ...rowStyle, flexWrap: 'wrap', gap: '12px' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                            <strong>주문 #{order.id}</strong>
                                            <span style={{ fontSize: '13px', color: '#666' }}>{order.username}</span>
                                            <span style={orderBadgeStyle(order.status)}>{ORDER_STATUS_LABEL[order.status] ?? order.status}</span>
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                                            {order.totalPrice.toLocaleString()}원 &nbsp;|&nbsp;
                                            {order.orderItems?.map(i => `${i.productName}(${i.quantity}개)`).join(', ')}
                                        </div>
                                    </div>
                                    {order.status === 'PAID' && (
                                        <button onClick={() => handleDeliver(order.id)} style={deliverBtnStyle}>배송 완료 처리</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'statistics' && (
                <div>
                    <h3 style={{ marginBottom: '15px' }}>매출 통계 대시보드</h3>
                    <StatisticsDashboard />
                </div>
            )}

            {activeTab === 'products' && (
            <div>
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #dee2e6' }}>
                <h3 style={{ marginTop: 0, marginBottom: '15px' }}>새 상품 등록</h3>
                {createMsg && (
                    <div style={{ marginBottom: '10px', color: createMsg.type === 'error' ? '#dc3545' : '#28a745' }}>
                        {createMsg.text}
                    </div>
                )}
                <form onSubmit={handleCreateSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                            <label style={labelStyle}>상품명</label>
                            <input type="text" name="name" value={createForm.name} onChange={handleCreateChange} style={inputStyle} required />
                        </div>
                        <div>
                            <label style={labelStyle}>가격 (원)</label>
                            <input type="number" name="price" value={createForm.price} onChange={handleCreateChange} style={inputStyle} min="0" required />
                        </div>
                        <div>
                            <label style={labelStyle}>재고 수량</label>
                            <input type="number" name="stockQuantity" value={createForm.stockQuantity} onChange={handleCreateChange} style={inputStyle} min="0" required />
                        </div>
                        <div>
                            <label style={labelStyle}>카테고리</label>
                            <select name="category" value={createForm.category} onChange={handleCreateChange} style={inputStyle}>
                                {CATEGORIES.map((c) => <option key={c} value={c}>{c || '선택 없음'}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>상품 이미지</label>
                            <input
                                type="file"
                                id="createFileInput"
                                accept="image/*"
                                onChange={(e) => setCreateFile(e.target.files[0])}
                                style={{ ...inputStyle, padding: '6px' }}
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <label style={labelStyle}>설명</label>
                        <textarea
                            name="description"
                            value={createForm.description}
                            onChange={handleCreateChange}
                            style={{ ...inputStyle, height: '60px', resize: 'vertical' }}
                        />
                    </div>
                    <button type="submit" style={primaryBtnStyle}>상품 등록</button>
                </form>
            </div>

            {/* 상품 목록 */}
            <h3 style={{ marginBottom: '15px' }}>등록된 상품 목록</h3>
            {listError && <div style={{ color: '#dc3545', marginBottom: '10px' }}>{listError}</div>}
            {listLoading ? (
                <p>상품을 불러오는 중...</p>
            ) : productList.length === 0 ? (
                <p style={{ color: '#666' }}>등록된 상품이 없습니다.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {productList.map(product => (
                        <div key={product.id} style={rowStyle}>
                            {editingId === product.id ? (
                                /* 수정 폼 (인라인) */
                                <div style={{ width: '100%' }}>
                                    <h4 style={{ margin: '0 0 12px 0', color: '#495057' }}>상품 수정 (ID: {product.id})</h4>
                                    {editMsg && (
                                        <div style={{ marginBottom: '10px', color: editMsg.type === 'error' ? '#dc3545' : '#28a745' }}>
                                            {editMsg.text}
                                        </div>
                                    )}
                                    <form onSubmit={handleEditSubmit}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                            <div>
                                                <label style={labelStyle}>상품명</label>
                                                <input type="text" name="name" value={editForm.name} onChange={handleEditChange} style={inputStyle} required />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>가격 (원)</label>
                                                <input type="number" name="price" value={editForm.price} onChange={handleEditChange} style={inputStyle} min="0" required />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>재고 수량</label>
                                                <input type="number" name="stockQuantity" value={editForm.stockQuantity} onChange={handleEditChange} style={inputStyle} min="0" required />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>카테고리</label>
                                                <select name="category" value={editForm.category} onChange={handleEditChange} style={inputStyle}>
                                                    {CATEGORIES.map((c) => <option key={c} value={c}>{c || '선택 없음'}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={labelStyle}>새 이미지 (변경 시만 선택)</label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => setEditFile(e.target.files[0])}
                                                    style={{ ...inputStyle, padding: '6px' }}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: '10px' }}>
                                            <label style={labelStyle}>설명</label>
                                            <textarea
                                                name="description"
                                                value={editForm.description}
                                                onChange={handleEditChange}
                                                style={{ ...inputStyle, height: '50px', resize: 'vertical' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button type="submit" style={primaryBtnStyle}>저장</button>
                                            <button type="button" onClick={cancelEdit} style={cancelBtnStyle}>취소</button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                /* 상품 정보 행 */
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, minWidth: 0 }}>
                                        <div style={thumbnailStyle}>
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <span style={{ color: '#aaa', fontSize: '11px' }}>없음</span>
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <strong style={{ fontSize: '15px' }}>{product.name}</strong>
                                            <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
                                                {product.price.toLocaleString()}원 &nbsp;|&nbsp; 재고: {product.stockQuantity}개
                                            </div>
                                            {product.description && (
                                                <div style={{ color: '#999', fontSize: '12px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {product.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                        <button onClick={() => startEdit(product)} style={editBtnStyle}>수정</button>
                                        <button onClick={() => handleDelete(product.id)} style={deleteBtnStyle}>삭제</button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
            </div>
            )}
        </div>
    );
};

const ORDER_STATUS_BADGE_CONFIG = {
    ORDERED:   { background: '#e3f2fd', color: '#1565c0' },
    PAID:      { background: '#e8f5e9', color: '#2e7d32' },
    SHIPPING:  { background: '#fff8e1', color: '#f57f17' },
    DELIVERED: { background: '#e8f5e9', color: '#1b5e20' },
    CANCELED:  { background: '#fce4ec', color: '#c62828' },
};
const orderBadgeStyle = (s) => ({
    padding: '2px 8px', borderRadius: '20px', fontSize: '12px',
    ...(ORDER_STATUS_BADGE_CONFIG[s] ?? { background: '#f5f5f5', color: '#888' }),
});

const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#495057' };
const rowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', border: '1px solid #dee2e6', borderRadius: '10px', background: '#fff', gap: '10px' };
const thumbnailStyle = { width: '60px', height: '60px', flexShrink: 0, borderRadius: '6px', overflow: 'hidden', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const primaryBtnStyle = { padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const editBtnStyle = { padding: '8px 14px', background: '#ffc107', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const deleteBtnStyle = { padding: '8px 14px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const cancelBtnStyle = { padding: '10px 20px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const tabBtnStyle = { padding: '8px 20px', background: '#e9ecef', color: '#495057', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' };
const activeTabBtnStyle = { ...tabBtnStyle, background: '#343a40', color: '#fff' };
const deliverBtnStyle = { padding: '6px 14px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', flexShrink: 0 };

export default AdminDashboard;
