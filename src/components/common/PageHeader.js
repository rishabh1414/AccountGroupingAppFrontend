import React from "react";

/**
 * A reusable header component for pages.
 * @param {object} props
 * @param {string} props.title - The main title of the page.
 * @param {string} props.subtitle - A brief description under the title.
 * @param {React.ReactNode} props.actions - A slot for action buttons or other controls.
 */
const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between mb-4">
      <div>
        <h1 className="text-4xl font-bold text-gray-800 m-0">{title}</h1>
        <p className="text-lg text-gray-500 mt-1 mb-0">{subtitle}</p>
      </div>
      <div className="mt-3 md:mt-0">{actions}</div>
    </div>
  );
};

export default PageHeader;
