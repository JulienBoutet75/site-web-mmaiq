import React, { useState, useEffect, useRef } from 'react';
import { useSite } from '../../context/SiteContext';
import { listFiles, uploadFile, deleteFile, getPublicUrl, getMediaUrl } from '../../lib/supabase';
import { X, UploadCloud, Copy, Trash2, Scissors, Image as ImageIcon, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VideoEditorModal } from './VideoEditorModal';

export function MediathequeDrawer() {
  const { isMediathequeOpen, setIsMediathequeOpen, mediathequeSelectCallback, setMediathequeSelectCallback } = useSite();
  const [files, setFiles] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'images' | 'videos'>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isMediathequeOpen) {
      loadFiles();
    }
  }, [isMediathequeOpen]);

  const loadFiles = async () => {
    try {
      const images = await listFiles('images');
      const videos = await listFiles('formations-videos');
      
      const allFiles = [
        ...(images || []).map((f: any) => ({ ...f, bucket: 'images', type: 'image' })),
        ...(videos || []).map((f: any) => ({ ...f, bucket: 'formations-videos', type: 'video' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Deux URLs par fichier :
      // - url : URL canonique publique (stable), la seule que Sélectionner/Copier
      //   renvoient — c'est elle qu'on persiste, le serveur sait la signer ;
      // - previewUrl : URL signée éphémère (1 h), uniquement pour l'aperçu du
      //   drawer quand formations-videos passe en privé. getMediaUrl retombe
      //   seule sur l'URL publique si la signature échoue (bucket encore public).
      // Le bucket images reste public : previewUrl = url directement.
      const withUrls = await Promise.all(
        allFiles.map(async (f: any) => {
          const url = getPublicUrl(f.bucket, f.name);
          const previewUrl = f.bucket === 'formations-videos'
            ? await getMediaUrl(f.bucket, f.name)
            : url;
          return { ...f, url, previewUrl };
        })
      );

      setFiles(withUrls);
    } catch (error) {
      console.error("Failed to load files", error);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10); // Fake progress for UX
    setUploadError(null);
    
    try {
      const bucket = file.type.startsWith('video/') ? 'formations-videos' : 'images';
      await uploadFile(bucket, file);
      setUploadProgress(100);
      await loadFiles();
    } catch (error: any) {
      console.error("Upload failed", error);
      setUploadError(error.message || "Erreur lors de l'upload. Vérifiez que les buckets existent dans Supabase.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (bucket: string, name: string) => {
    // In an iframe, confirm() might be blocked. We'll just delete directly for now,
    // or you could implement a custom modal.
    try {
      await deleteFile(bucket, name);
      await loadFiles();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    // alert is blocked in iframe, we could use a toast here
  };

  const handleSelect = (url: string) => {
    if (mediathequeSelectCallback) {
      mediathequeSelectCallback(url);
      setMediathequeSelectCallback(null);
      setIsMediathequeOpen(false);
    }
  };

  const filteredFiles = files.filter(f => {
    if (filter === 'all') return true;
    return f.type === filter;
  });

  if (!isMediathequeOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[10000] flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => {
            setIsMediathequeOpen(false);
            setMediathequeSelectCallback(null);
          }}
        />
        
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-[450px] bg-[#0d0d1a] border-l border-[#1e1e34] h-full flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#1e1e34] flex items-center justify-between">
            <div>
              <h2 className="font-days-one text-[20px] text-white">Médiathèque</h2>
              <p className="text-sm text-gray-400">{files.length} fichiers</p>
            </div>
            <button
              onClick={() => {
                setIsMediathequeOpen(false);
                setMediathequeSelectCallback(null);
              }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Filters */}
          <div className="p-4 flex gap-2 border-b border-[#1e1e34]">
            {(['all', 'images', 'videos'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                  filter === f ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {f === 'all' ? 'Tous' : f}
              </button>
            ))}
          </div>

          {/* Upload Area */}
          <div className="p-6 border-b border-[#1e1e34]">
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all relative overflow-hidden ${
                uploadError 
                  ? 'border-red-500/50 hover:border-red-500 hover:bg-red-500/10' 
                  : 'border-purple-500/50 hover:border-purple-500 hover:bg-purple-500/10 cursor-pointer group'
              }`}
            >
              {isUploading ? (
                <div className="w-full">
                  <p className="text-purple-400 mb-2 font-medium">Upload en cours...</p>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : uploadError ? (
                <>
                  <div className="text-red-400 mb-3 font-medium">Échec de l'upload</div>
                  <p className="text-xs text-red-400/80 mb-4">{uploadError}</p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadError(null);
                    }}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                  >
                    Réessayer
                  </button>
                </>
              ) : (
                <>
                  <UploadCloud size={32} className="text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-gray-300 font-medium">Glisse un fichier ici ou clique pour uploader</p>
                  <p className="text-xs text-gray-500 mt-2">Images (PNG, JPG) ou Vidéos (MP4)</p>
                </>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUpload}
              accept="image/*,video/*"
              className="hidden"
            />
          </div>

          {/* File Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-4">
              {filteredFiles.map((file) => {
                // Ignore empty folder placeholders
                if (file.name === '.emptyFolderPlaceholder') return null;
                
                // url : canonique publique, à persister (Sélectionner, Copier).
                // previewUrl : signée, réservée aux aperçus <img>/<video> et à l'éditeur.
                const url = file.url;
                const previewUrl = file.previewUrl;
                return (
                  <div key={file.id} className="group relative bg-[#111120] rounded-xl border border-[#1e1e34] overflow-hidden hover:border-purple-500 transition-colors">
                    {/* Thumbnail */}
                    <div 
                      className="aspect-square bg-black/50 relative cursor-pointer"
                      onClick={() => handleSelect(url)}
                    >
                      {file.type === 'image' ? (
                        <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center relative">
                          <video src={previewUrl} className="w-full h-full object-cover opacity-50" />
                          <Video size={24} className="absolute text-white/50" />
                        </div>
                      )}
                      
                      {/* Select Overlay */}
                      {mediathequeSelectCallback && (
                        <div className="absolute inset-0 bg-purple-600/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-white font-medium text-sm">Sélectionner</span>
                        </div>
                      )}
                    </div>

                    {/* Info & Actions */}
                    <div className="p-3">
                      <p className="text-xs text-gray-300 truncate mb-2" title={file.name}>{file.name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 uppercase bg-white/5 px-2 py-1 rounded">
                          {(file.metadata?.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                        <div className="flex gap-1">
                          {file.type === 'video' && (
                            <button onClick={() => setEditingVideo(previewUrl)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded transition-colors" title="Éditer la vidéo">
                              <Scissors size={14} />
                            </button>
                          )}
                          <button onClick={() => handleCopy(url)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Copier l'URL">
                            <Copy size={14} />
                          </button>
                          <button onClick={() => handleDelete(file.bucket, file.name)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors" title="Supprimer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredFiles.length === 0 && (
              <div className="text-center text-gray-500 mt-10">
                Aucun fichier trouvé.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Video Editor Modal */}
      {editingVideo && (
        <VideoEditorModal
          videoUrl={editingVideo}
          onClose={() => setEditingVideo(null)}
        />
      )}
    </>
  );
}
