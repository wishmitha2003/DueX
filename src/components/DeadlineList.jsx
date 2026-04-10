import React from 'react';
import DeadlineItem from './DeadlineItem.jsx';

const DeadlineList = ({ deadlines, onEdit, onDelete }) => {
  return (
    <div className="deadline-list">
      {deadlines.map(deadline => (
        <DeadlineItem 
          key={deadline.id} 
          deadline={deadline} 
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
      <style>{`
        .deadline-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding-bottom: 1rem;
        }
      `}</style>
    </div>
  );
};

export default DeadlineList;
