import React, { useState } from 'react';

const StarRating = ({ rating, setRating }) => {
    const [hover, setHover] = useState(0);

    return (
        <div style={{ display: 'flex', gap: '5px', cursor: 'pointer', marginBottom: '10px'}}>
            {[1,2,3,4,5].map((star) => {
                return (
                    <span
                        key={star}
                        style={{
                            fontSize:'24px',
                            color: star <= (hover || rating) ? '#ffc107' : '#e4e5e9',
                            transition: 'color 0.2s'
                        }}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                    >
                        ★
                    </span>
                );
            })}
        </div>
    );
};

export default StarRating;