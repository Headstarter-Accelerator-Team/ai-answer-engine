import React, { useState } from "react";

interface Option {
  value: string;
  label: string;
}

function Dropdown({ options }: { options: Option[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option: Option) => {
    setSelectedOption(option);
    setIsOpen(false);
  };

  return (
    <div className="dropdown">
      <button
        className="dropdown-button bg-black text-white"
        onClick={toggleDropdown}
      >
        {selectedOption ? selectedOption.label : "Select a model to use"}
      </button>
      {isOpen && (
        <ul className="dropdown-menu bg-black text-white">
          {options.map(option => (
            <li
              key={option.value}
              onClick={() => handleOptionClick(option)}
              className="dropdown-item hover:bg-gray-200"
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dropdown;
