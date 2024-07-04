import React, { createContext, useReducer, useContext, useEffect, useState } from 'react';

// Helper functions and CRUD operations

const getDataFromLocalStorage = () => {
  const storedData = localStorage.getItem('categoryData');
  return storedData ? JSON.parse(storedData) : [];
};

const saveDataToLocalStorage = (data) => {
  localStorage.setItem('categoryData', JSON.stringify(data));
};

const generateId = () => Math.floor(Math.random() * 100000);

const findCategoryById = (categories, id) => {
  for (let category of categories) {
    if (category.id === id) return category;
    if (category.categories) {
      const found = findCategoryById(category.categories, id);
      if (found) return found;
    }
  }
  return null;
};

// Context and Reducer
const CategoryContext = createContext();

const categoryReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_CATEGORY':
      const newCategory = {
        ...action.payload.newCategory,
        id: generateId(),
        parentId: action.payload.parentId,
        categories: [],
      };
      if (action.payload.parentId) {
        const parentCategory = findCategoryById(state, action.payload.parentId);
        parentCategory.categories.push(newCategory);
      } else {
        state.push(newCategory);
      }
      return [...state];

    case 'UPDATE_CATEGORY':
      const categoryToUpdate = findCategoryById(state, action.payload.categoryId);
      Object.assign(categoryToUpdate, action.payload.updatedCategory);
      return [...state];

    case 'DELETE_CATEGORY':
      const removeCategory = (categories, id) => {
        for (let i = 0; i < categories.length; i++) {
          if (categories[i].id === id) {
            categories.splice(i, 1);
            return true;
          } else if (categories[i].categories && removeCategory(categories[i].categories, id)) {
            return true;
          }
        }
        return false;
      };
      removeCategory(state, action.payload.categoryId);
      return [...state];

    case 'SET_CATEGORIES':
      return action.payload;

    default:
      return state;
  }
};

const CategoryProvider = ({ children }) => {
  const [state, dispatch] = useReducer(categoryReducer, [], () => getDataFromLocalStorage());

  useEffect(() => {
    saveDataToLocalStorage(state);
  }, [state]);

  return (
    <CategoryContext.Provider value={{ categories: state, dispatch }}>
      {children}
    </CategoryContext.Provider>
  );
};

const useCategories = () => useContext(CategoryContext);

// Category Component
const Category = ({ category }) => {
  const { dispatch } = useCategories();
  const [isOpen, setIsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(category.name);
  const [imageUrl, setImageUrl] = useState(category.imageUrl);

  const toggleOpen = () => setIsOpen(!isOpen);
  const toggleEditMode = () => setEditMode(!editMode);

  const handleUpdate = () => {
    dispatch({ type: 'UPDATE_CATEGORY', payload: { categoryId: category.id, updatedCategory: { name, imageUrl } } });
    setEditMode(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      dispatch({ type: 'DELETE_CATEGORY', payload: { categoryId: category.id } });
    }
  };

  const handleAddSubcategory = () => {
    const subCategoryName = prompt('Enter subcategory name:');
    if (subCategoryName) {
      dispatch({ type: 'ADD_CATEGORY', payload: { newCategory: { name: subCategoryName, imageUrl: '' }, parentId: category.id } });
    }
  };

  return (
    <div className="p-4 border-l-2">
      <div className="flex items-center cursor-pointer" onClick={toggleOpen}>
        <img src={imageUrl || "https://pos.softghor.com/dashboard/images/not-available.png"} alt={name} className="w-12 h-12 mr-4" />
        {editMode ? (
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="font-semibold" />
        ) : (
          <span className="font-semibold">{name}</span>
        )}
        {category.categories && category.categories.length > 0 && (
          <span className="ml-2">{isOpen ? '-' : '+'}</span>
        )}
        {editMode && (
          <button className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleUpdate}>
            Save
          </button>
        )}
        <button className="ml-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onClick={handleDelete}>
          Delete
        </button>
        {!editMode && (
          <button className="ml-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded" onClick={toggleEditMode}>
            Edit
          </button>
        )}
        <button className="ml-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" onClick={handleAddSubcategory}>
          Add Subcategory
        </button>
      </div>
      {isOpen && category.categories && category.categories.length > 0 && (
        <div className="ml-8">
          {category.categories.map((subCategory) => (
            <Category key={subCategory.id} category={subCategory} />
          ))}
        </div>
      )}
    </div>
  );
};

// Main Component
const Categories = () => {
  const { categories, dispatch } = useCategories();

  const handleAddCategory = () => {
    const categoryName = prompt('Enter category name:');
    if (categoryName) {
      dispatch({ type: 'ADD_CATEGORY', payload: { newCategory: { name: categoryName, imageUrl: '' }, parentId: null } });
    }
  };

  return (
    <div className="p-8">
      <button className="mb-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" onClick={handleAddCategory}>
        Add Category
      </button>
      {categories.map((category) => (
        <Category key={category.id} category={category} />
      ))}
    </div>
  );
};

// App Component
const App = () => {
  return (
    <CategoryProvider>
      <div className="container mx-auto">
        <Categories />
      </div>
    </CategoryProvider>
  );
};

export default App;