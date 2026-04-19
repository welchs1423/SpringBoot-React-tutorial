import React from 'react';

const CATEGORIES = ['', '전자제품', '의류', '식품', '스포츠/레저', '뷰티', '도서', '가구/인테리어', '기타'];

const SORT_OPTIONS = [
    { value: 'latest', label: '최신순' },
    { value: 'priceAsc', label: '가격 낮은순' },
    { value: 'priceDesc', label: '가격 높은순' },
    { value: 'rating', label: '평점 높은순' },
];

const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    boxSizing: 'border-box',
    fontSize: '14px',
};

const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: '4px',
};

export default function ProductFilter({ filters, onChange, onReset }) {
    const handleChange = (field, value) => {
        onChange({ ...filters, [field]: value, page: 0 });
    };

    return (
        <div style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'end' }}>
                <div>
                    <label style={labelStyle}>키워드</label>
                    <input
                        type="text"
                        placeholder="상품명 검색..."
                        value={filters.keyword}
                        onChange={(e) => handleChange('keyword', e.target.value)}
                        style={inputStyle}
                    />
                </div>

                <div>
                    <label style={labelStyle}>카테고리</label>
                    <select
                        value={filters.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        style={inputStyle}
                    >
                        {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c || '전체'}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={labelStyle}>최소 가격 (원)</label>
                    <input
                        type="number"
                        placeholder="0"
                        min="0"
                        value={filters.priceMin}
                        onChange={(e) => handleChange('priceMin', e.target.value)}
                        style={inputStyle}
                    />
                </div>

                <div>
                    <label style={labelStyle}>최대 가격 (원)</label>
                    <input
                        type="number"
                        placeholder="제한 없음"
                        min="0"
                        value={filters.priceMax}
                        onChange={(e) => handleChange('priceMax', e.target.value)}
                        style={inputStyle}
                    />
                </div>

                <div>
                    <label style={labelStyle}>정렬</label>
                    <select
                        value={filters.sort}
                        onChange={(e) => handleChange('sort', e.target.value)}
                        style={inputStyle}
                    >
                        {SORT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                        onClick={onReset}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #adb5bd', background: '#fff', color: '#495057', cursor: 'pointer', fontSize: '14px' }}
                    >
                        초기화
                    </button>
                </div>
            </div>
        </div>
    );
}
