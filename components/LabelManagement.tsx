import React, { useState } from 'react';
import { Label } from '../types';
import { PlusIcon, TrashIcon, PencilIcon } from './icons/Icons';

interface LabelManagementProps {
  title: string;
  labels: Label[];
  setLabels: React.Dispatch<React.SetStateAction<Label[]>>;
  projectId: string | null;
  showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
}

const COLORS = [
  'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500',
  'bg-indigo-500', 'bg-pink-500', 'bg-teal-500', 'bg-purple-500'
];

const LabelManagement: React.FC<LabelManagementProps> = ({ title, labels, setLabels, projectId, showConfirmation }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemColor, setNewItemColor] = useState(COLORS[0]);
  const [editingItem, setEditingItem] = useState<Label | null>(null);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim()) {
      const newLabel: Label = {
        id: crypto.randomUUID(),
        name: newItemName.trim(),
        color: newItemColor,
        projectId: projectId,
      };
      setLabels(prev => [...prev, newLabel]);
      setNewItemName('');
    }
  };

  const handleDeleteItem = (id: string) => {
    const itemToDelete = labels.find(item => item.id === id);
    if (itemToDelete) {
      showConfirmation(
        '라벨 삭제',
        `'${itemToDelete.name}' 라벨을(를) 정말 삭제하시겠습니까?`,
        () => {
          setLabels(prev => prev.filter(item => item.id !== id));
        }
      );
    }
  };
  
  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem && editingItem.name.trim()) {
        setLabels(prev => prev.map(item => item.id === editingItem.id ? editingItem : item));
        setEditingItem(null);
    }
  };

  const startEditing = (item: Label) => {
    setEditingItem({ ...item });
  };

  return (
    <div>
      <h4 className="text-lg font-bold mb-3 text-gray-300">
        {title}
      </h4>
      
      <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder={`새 라벨 이름`}
          className="flex-grow bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg p-1">
            {COLORS.map(color => (
                <button type="button" key={color} onClick={() => setNewItemColor(color)} className={`w-5 h-5 rounded-full ${color} ${newItemColor === color ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-white' : ''}`}></button>
            ))}
        </div>
        <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white font-bold p-2 rounded-lg transition-colors">
          <PlusIcon className="w-5 h-5" />
        </button>
      </form>

      <div className="space-y-2">
        {labels.map(item => (
          <div key={item.id}>
          {editingItem?.id === item.id ? (
            <form onSubmit={handleUpdateItem} className="flex items-center gap-2 p-2 bg-gray-700/80 rounded-lg">
                <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="flex-grow bg-gray-600 border border-gray-500 rounded-md px-2 py-1"
                />
                 <div className="flex items-center gap-1">
                    {COLORS.map(color => (
                        <button type="button" key={color} onClick={() => setEditingItem({ ...editingItem, color: color })} className={`w-5 h-5 rounded-full ${color} ${editingItem.color === color ? 'ring-2 ring-white' : ''}`}></button>
                    ))}
                </div>
                <button type="submit" className="text-emerald-400 hover:text-emerald-300 p-1">저장</button>
                <button type="button" onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-200 p-1">취소</button>
            </form>
          ) : (
            <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg group">
              <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
              <span className="flex-grow">{item.name}</span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                <button onClick={() => startEditing(item)} className="p-1 text-gray-400 hover:text-amber-400 transition-colors">
                    <PencilIcon className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteItem(item.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                    <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
           )}
          </div>
        ))}
         {labels.length === 0 && (
          <p className="text-sm text-gray-500 px-2">라벨이 없습니다.</p>
        )}
      </div>
    </div>
  );
}

export default LabelManagement;