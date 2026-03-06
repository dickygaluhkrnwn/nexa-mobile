import { useState } from "react";

export function useNoteForm(initialData = { title: "", content: "", tags: [] as string[], isHidden: false, parentId: null as string | null }) {
  const [title, setTitle] = useState(initialData.title);
  const [content, setContent] = useState(initialData.content);
  const [tags, setTags] = useState<string[]>(initialData.tags);
  const [tagInput, setTagInput] = useState("");
  const [isHidden, setIsHidden] = useState(initialData.isHidden);
  const [parentId, setParentId] = useState<string | null>(initialData.parentId);

  const handleAddTag = () => {
    if (tagInput.trim() !== '') {
      const newTag = tagInput.trim().replace(/^#/, '');
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  return {
    title, setTitle,
    content, setContent,
    tags, setTags,
    tagInput, setTagInput,
    isHidden, setIsHidden,
    parentId, setParentId,
    handleAddTag, removeTag
  };
}