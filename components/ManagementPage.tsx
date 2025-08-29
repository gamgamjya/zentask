import React, { useState } from 'react';
import { PlusIcon, TrashIcon, PencilIcon } from './icons/Icons';

interface Item {
  id: string;
  name: string;
  color: string;
}

interface ManagementPageProps<T extends Item> {
  title: string;
  itemName: string;
  items: T[];
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  Icon: React.ElementType;
}

const COLORS = [
  'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500',
  'bg-indigo-500', 'bg-pink-500', 'bg-teal-500', 'bg-purple-500'
];

function ManagementPage<T extends Item,>({ title, itemName, items, setItems, Icon }: ManagementPageProps<T>) {
  const [newItemName, setNewItemName] = useState('');
  const [newItemColor, setNewItemColor] = useState(COLORS[0]);
  const [editingItem, setEditingItem] = useState<T | null>(null);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim()) {
      setItems(prev => [...prev, {
        id: crypto.randomUUID(),
        name: newItemName.trim(),
        color: newItemColor,
      } as T]);
      setNewItemName('');
    }
  };

  const handleDeleteItem = (id: string) => {
    const itemToDelete = items.find(item => item.id === id);
    if (itemToDelete && window.confirm(`'${itemToDelete.name}' ${itemName}을(를) 정말 삭제하시겠습니까?`)) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };
  
  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if(editingItem && editingItem.name.trim()) {
        setItems(prev => prev.map(item => item.id === editingItem.id ? editingItem : item));
        setEditingItem(null);
    }
  };

  const startEditing = (item: T) => {
    setEditingItem({...item});
  };

  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-300">
        <Icon className="w-6 h-6" />
        {title}
      </h3>
      
      {/* Add Item Form */}
      <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder={`새 ${itemName} 이름`}
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

      {/* Items List */}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {items.map(item => (
          <div key={item.id}>
          {editingItem?.id === item.id ? (
            <form onSubmit={handleUpdateItem} className="flex items-center gap-2 p-2 bg-gray-700/80 rounded-lg">
                <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                    className="flex-grow bg-gray-600 border border-gray-500 rounded-md px-2 py-1"
                />
                 <div className="flex items-center gap-1">
                    {COLORS.map(color => (
                        <button type="button" key={color} onClick={() => setEditingItem({...editingItem, color: color})} className={`w-5 h-5 rounded-full ${color} ${editingItem.color === color ? 'ring-2 ring-white' : ''}`}></button>
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
      </div>
    </div>
  );
}

export default ManagementPage;