import React, { useState, useEffect, useCallback } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { apiClient } from './api/apiClient';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const formatAmount = (v) => `${Number(v).toLocaleString()}원`;

const StatisticsDashboard = () => {
    const [mode, setMode] = useState('daily');
    const [year, setYear] = useState(new Date().getFullYear());
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 29);
        return d.toISOString().slice(0, 10);
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let result;
            if (mode === 'daily') {
                result = await apiClient.get(`/admin/statistics/daily?startDate=${startDate}&endDate=${endDate}`);
            } else {
                result = await apiClient.get(`/admin/statistics/monthly?year=${year}`);
            }
            setData(result);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [mode, startDate, endDate, year]);

    useEffect(() => { load(); }, [load]);

    const salesData = mode === 'daily'
        ? (data?.dailySales || []).map(d => ({ name: d.date, 매출: d.totalAmount, 주문건수: d.orderCount }))
        : (data?.monthlySales || []).map(d => ({ name: d.month, 매출: d.totalAmount, 주문건수: d.orderCount }));

    const categoryData = (data?.categorySales || []).map(c => ({
        name: c.category || '미분류',
        value: c.totalAmount,
    }));

    const totalSales = salesData.reduce((s, d) => s + (d.매출 || 0), 0);
    const totalOrders = salesData.reduce((s, d) => s + (d.주문건수 || 0), 0);

    return (
        <div style={{ padding: '16px 0' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={() => setMode('daily')}
                    style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                        background: mode === 'daily' ? '#6366f1' : '#e5e7eb', color: mode === 'daily' ? '#fff' : '#333' }}>
                    일간
                </button>
                <button onClick={() => setMode('monthly')}
                    style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                        background: mode === 'monthly' ? '#6366f1' : '#e5e7eb', color: mode === 'monthly' ? '#fff' : '#333' }}>
                    월간
                </button>
                {mode === 'daily' ? (
                    <>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #ccc' }} />
                        <span>~</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #ccc' }} />
                    </>
                ) : (
                    <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
                        min={2020} max={2099} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #ccc', width: 90 }} />
                )}
                <button onClick={load} style={{ padding: '6px 14px', borderRadius: 6, border: 'none',
                    background: '#10b981', color: '#fff', cursor: 'pointer' }}>조회</button>
            </div>

            {loading && <p style={{ color: '#6366f1' }}>불러오는 중...</p>}
            {error && <p style={{ color: '#ef4444' }}>오류: {error}</p>}

            {!loading && !error && (
                <>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 160, background: '#eef2ff', borderRadius: 10, padding: '14px 20px' }}>
                            <div style={{ fontSize: 13, color: '#6366f1', marginBottom: 4 }}>총 매출</div>
                            <div style={{ fontSize: 22, fontWeight: 700 }}>{formatAmount(totalSales)}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 160, background: '#ecfdf5', borderRadius: 10, padding: '14px 20px' }}>
                            <div style={{ fontSize: 13, color: '#10b981', marginBottom: 4 }}>총 주문 건수</div>
                            <div style={{ fontSize: 22, fontWeight: 700 }}>{totalOrders.toLocaleString()}건</div>
                        </div>
                    </div>

                    <div style={{ background: '#fff', borderRadius: 10, padding: 16, marginBottom: 24,
                        border: '1px solid #e5e7eb' }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>매출 추이</h3>
                        {salesData.length === 0 ? (
                            <p style={{ color: '#9ca3af', textAlign: 'center' }}>데이터 없음</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={salesData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis yAxisId="left" tickFormatter={v => `${(v/1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(v, name) => name === '매출' ? formatAmount(v) : `${v}건`} />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="매출" stroke="#6366f1" strokeWidth={2} dot={false} />
                                    <Line yAxisId="right" type="monotone" dataKey="주문건수" stroke="#10b981" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div style={{ background: '#fff', borderRadius: 10, padding: 16,
                        border: '1px solid #e5e7eb' }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>카테고리별 매출 비율</h3>
                        {categoryData.length === 0 ? (
                            <p style={{ color: '#9ca3af', textAlign: 'center' }}>데이터 없음</p>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                                <ResponsiveContainer width={260} height={220}>
                                    <PieChart>
                                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                                            dataKey="value" nameKey="name">
                                            {categoryData.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v) => formatAmount(v)} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ flex: 1 }}>
                                    {categoryData.map((c, i) => {
                                        const pct = totalSales > 0 ? ((c.value / totalSales) * 100).toFixed(1) : 0;
                                        return (
                                            <div key={c.name} style={{ display: 'flex', alignItems: 'center',
                                                gap: 8, marginBottom: 6, fontSize: 13 }}>
                                                <span style={{ width: 12, height: 12, borderRadius: 3,
                                                    background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                                                <span style={{ flex: 1 }}>{c.name}</span>
                                                <span style={{ color: '#6b7280' }}>{pct}%</span>
                                                <span style={{ fontWeight: 600 }}>{formatAmount(c.value)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default StatisticsDashboard;
