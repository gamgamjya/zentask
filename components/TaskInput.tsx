import React, { useState, useEffect, useRef } from 'react';
import { Project, Label } from '../types';
import { PlusIcon } from './icons/Icons';

interface TaskInputProps {
  onAddTask: (content: string, projectId: string | null, labelId: string | null) => void;
  projects: Project[];
  labels: Label[];
}

type SuggestionType = 'project' | 'label';
interface Suggestion {
  id: string;
  name: string;
  type: SuggestionType;
}

const TaskInput: React.FC<TaskInputProps> = ({ onAddTask, projects, labels }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const triggerRef = useRef<{ char: '#' | '@'; position: number } | null>(null);

  const resetSuggestions = () => {
    setSuggestions([]);
    setActiveSuggestion(0);
    triggerRef.current = null;
  };

  useEffect(() => {
    const projectRegexWithCapture = /#(\S+)/;
    const projectMatchForLabel = inputValue.match(projectRegexWithCapture);
    let currentProjectId: string | null = null;
    if (projectMatchForLabel) {
      const projectName = projectMatchForLabel[1];
      const project = projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
      if (project) {
        currentProjectId = project.id;
      }
    }

    const projectRegex = /#([\p{L}\d_]*)$/u;
    const labelRegex = /@([\p{L}\d_]*)$/u;

    const projectMatch = inputValue.match(projectRegex);
    const labelMatch = inputValue.match(labelRegex);

    if (projectMatch) {
      triggerRef.current = { char: '#', position: projectMatch.index! };
      const query = projectMatch[1].toLowerCase();
      setSuggestions(
        projects
          .filter(p => p.name.toLowerCase().includes(query))
          .map(p => ({ id: p.id, name: p.name, type: 'project' }))
      );
    } else if (labelMatch) {
      triggerRef.current = { char: '@', position: labelMatch.index! };
      const query = labelMatch[1].toLowerCase();
      
      const filteredLabels = labels
        .filter(l => l.projectId === null || l.projectId === currentProjectId)
        .filter(l => l.name.toLowerCase().includes(query));

      filteredLabels.sort((a, b) => {
        if (a.projectId !== null && b.projectId === null) return -1;
        if (a.projectId === null && b.projectId !== null) return 1;
        return a.name.localeCompare(b.name);
      });

      setSuggestions(
        filteredLabels.map(l => ({ id: l.id, name: l.name, type: 'label' }))
      );
    } else {
      resetSuggestions();
    }
  }, [inputValue, projects, labels]);
  
  const handleSelectSuggestion = (suggestion: Suggestion) => {
    if (!triggerRef.current) return;
    const prefix = inputValue.substring(0, triggerRef.current.position);
    setInputValue(`${prefix}${triggerRef.current.char}${suggestion.name} `);
    resetSuggestions();
    document.getElementById('task-input-field')?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if(suggestions[activeSuggestion]){
          handleSelectSuggestion(suggestions[activeSuggestion]);
      }
    } else if (e.key === 'Escape') {
      resetSuggestions();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    let content = inputValue.trim();
    if (!content) return;

    let projectId: string | null = null;
    let labelId: string | null = null;

    const projectRegex = /#(\S+)/;
    const labelRegex = /@(\S+)/;

    const projectMatch = content.match(projectRegex);
    if (projectMatch) {
      const projectName = projectMatch[1];
      const foundProject = projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
      if (foundProject) {
        projectId = foundProject.id;
        content = content.replace(projectRegex, '').trim();
      }
    }

    const labelMatch = content.match(labelRegex);
    if (labelMatch) {
      const labelName = labelMatch[1].toLowerCase();
      const projectSpecificLabel = labels.find(l => l.name.toLowerCase() === labelName && l.projectId === projectId);
      const globalLabel = labels.find(l => l.name.toLowerCase() === labelName && l.projectId === null);
      const foundLabel = projectSpecificLabel || globalLabel;
      
      if (foundLabel) {
        labelId = foundLabel.id;
        content = content.replace(labelRegex, '').trim();
      }
    }

    onAddTask(content, projectId, labelId);
    setInputValue('');
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          id="task-input-field"
          type="text"
          value={inputValue}
          onChange={(e) => {
              setInputValue(e.target.value);
              setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="예: 보고서 끝내기 #업무 @긴급"
          className="flex-grow bg-gray-900/70 border border-gray-700/80 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
          autoComplete="off"
        />
        <button
          type="submit"
          className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>추가</span>
        </button>
      </form>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      {suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-gray-950/80 backdrop-blur-md border border-gray-700 rounded-lg mt-2 shadow-lg overflow-hidden">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              className={`px-4 py-2 cursor-pointer ${
                index === activeSuggestion ? 'bg-sky-600' : 'hover:bg-gray-800'
              }`}
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              {suggestion.type === 'project' ? '#' : '@'}{suggestion.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TaskInput;