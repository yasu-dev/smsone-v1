import React, { useState } from 'react';
import { motion } from 'framer-motion';
import TemplateList from '../components/templates/TemplateList';
import TemplateForm from '../components/templates/TemplateForm';
import { Template } from '../types';

const Templates: React.FC = () => {
  const [editingTemplate, setEditingTemplate] = useState<Template | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setIsFormOpen(true);
  };
  
  const handleCloseForm = () => {
    setEditingTemplate(undefined);
    setIsFormOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold text-grey-900 mb-6">テンプレート管理</h1>
      
      <TemplateList 
        onEditTemplate={handleEditTemplate}
      />
      
      {isFormOpen && (
        <TemplateForm 
          template={editingTemplate} 
          onClose={handleCloseForm} 
        />
      )}
    </motion.div>
  );
};

export default Templates;