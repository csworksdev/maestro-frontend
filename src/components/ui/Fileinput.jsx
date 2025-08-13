import React from "react";

const Fileinput = ({
  name,
  label = "Browse",
  onChange,
  onRemove, // ➡ callback baru untuk hapus file
  placeholder = "Choose a file or drop it here...",
  multiple,
  preview,
  className = "custom-class",
  id,
  selectedFile,
  badge,
  selectedFiles = [],
}) => {
  return (
    <div>
      <div className="filegroup">
        <label>
          <input
            type="file"
            onChange={onChange}
            className="bg-red-400 w-full hidden"
            name={name}
            id={id}
            multiple={multiple}
            placeholder={placeholder}
          />
          <div
            className={`w-full h-[40px] file-control flex items-center ${className}`}
          >
            {!multiple && (
              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                {selectedFile && (
                  <span
                    className={
                      badge ? "badge-title" : "text-slate-900 dark:text-white"
                    }
                  >
                    {selectedFile.name}
                  </span>
                )}
                {!selectedFile && (
                  <span className="text-slate-400">{placeholder}</span>
                )}
              </span>
            )}

            {multiple && (
              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                {selectedFiles.length > 0 && (
                  <span
                    className={
                      badge ? "badge-title" : "text-slate-900 dark:text-white"
                    }
                  >
                    {selectedFiles.length} files selected
                  </span>
                )}
                {selectedFiles.length === 0 && (
                  <span className="text-slate-400">{placeholder}</span>
                )}
              </span>
            )}
            <span className="file-name flex-none cursor-pointer border-l px-4 border-slate-200 dark:border-slate-700 h-full inline-flex items-center bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-base rounded-tr rounded-br font-normal">
              {label}
            </span>
          </div>

          {/* Preview untuk single */}
          {!multiple && preview && selectedFile && (
            <div className="w-[200px] h-[200px] mx-auto mt-6 relative">
              <img
                src={selectedFile ? URL.createObjectURL(selectedFile) : ""}
                className="w-full h-full block rounded object-contain border p-2 border-slate-200"
                alt={selectedFile?.name}
              />
              <button
                type="button"
                onClick={() => onRemove && onRemove()}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Preview untuk multiple */}
          {multiple && preview && selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-5 mt-6">
              {selectedFiles.map((file, index) => (
                <div
                  className="xl:w-1/5 md:w-1/3 w-1/2 rounded border p-2 border-slate-200 relative"
                  key={index}
                >
                  <img
                    src={file ? URL.createObjectURL(file) : ""}
                    className="object-cover w-full h-full rounded"
                    alt={file?.name}
                  />
                  <button
                    type="button"
                    onClick={() => onRemove && onRemove(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </label>
      </div>
    </div>
  );
};

export default Fileinput;
