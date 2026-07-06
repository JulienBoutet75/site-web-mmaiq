export const showToast = (message: string, isError = false) => {
  const div = document.createElement('div');
  div.className = `fixed bottom-4 right-4 p-4 rounded-xl text-white font-medium z-[9999] shadow-lg transition-all transform translate-y-0 opacity-100 ${isError ? 'bg-red-500' : 'bg-green-500'}`;
  div.innerText = message;
  document.body.appendChild(div);
  setTimeout(() => {
    div.style.opacity = '0';
    div.style.transform = 'translateY(20px)';
    setTimeout(() => div.remove(), 300);
  }, 5000);
};

export const customConfirm = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center backdrop-blur-sm';
    
    const modal = document.createElement('div');
    modal.className = 'bg-[#12122a] border border-[#22223a] p-6 rounded-2xl max-w-md w-full mx-4 shadow-2xl';
    
    const text = document.createElement('p');
    text.className = 'text-white mb-6 font-medium';
    text.innerText = message;
    
    const btnContainer = document.createElement('div');
    btnContainer.className = 'flex justify-end gap-4';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'px-4 py-2 rounded-xl text-sm font-medium bg-[#22223a] text-white hover:bg-[#2a2a44] transition-all';
    cancelBtn.innerText = 'Annuler';
    cancelBtn.onclick = () => {
      document.body.removeChild(overlay);
      resolve(false);
    };
    
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'px-4 py-2 rounded-xl text-sm font-medium bg-[#a020f0] text-white hover:bg-[#b848ff] transition-all';
    confirmBtn.innerText = 'Confirmer';
    confirmBtn.onclick = () => {
      document.body.removeChild(overlay);
      resolve(true);
    };
    
    btnContainer.appendChild(cancelBtn);
    btnContainer.appendChild(confirmBtn);
    modal.appendChild(text);
    modal.appendChild(btnContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  });
};
