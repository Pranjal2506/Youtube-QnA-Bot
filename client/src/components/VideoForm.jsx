import { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

const VideoForm = () => {
    const [url, setUrl] = useState("");
    const [question, setQuestion] = useState("");
    const [thumbnail, setThumbnail] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isPreprocessing, setIsPreprocessing] = useState(false);

    // Extract video ID from the YouTube URL
    const extractVideoID = (url) => {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname === "youtu.be") {
                return urlObj.pathname.slice(1);
            } else if (
                urlObj.hostname === "www.youtube.com" ||
                urlObj.hostname === "youtube.com"
            ) {
                return urlObj.searchParams.get("v");
            }
        } catch {
            return null;
        }
    };

    // Update thumbnail and start preprocessing on valid URL
    useEffect(() => {
        const id = extractVideoID(url);
        if (id) {
            setThumbnail(`https://img.youtube.com/vi/${id}/hqdefault.jpg`);
            setIsPreprocessing(true);

            axios
                .post("https://youtube-qna-bot.onrender.com/preprocess", { url })
                .then((res) => {
                    console.log("Preprocess complete:", res.data.message);
                    setError("");
                })
                .catch((err) => {
                    console.error("Preprocess failed:", err.response?.data || err.message);
                    setError("Error preprocessing video");
                    setThumbnail("");
                })
                .finally(() => {
                    setIsPreprocessing(false);
                });
        } else {
            setThumbnail("");
            setIsPreprocessing(false);
        }
    }, [url]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAnswer("");
        setError("");
        setLoading(true);

        try {
            const res = await axios.post("https://youtube-qna-bot.onrender.com/ask", {
                url,
                question,
            });
            setAnswer(res.data.answer);
        } catch (err) {
            setError(err.response?.data?.error || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 mt-12 bg-zinc-900 shadow-2xl rounded-3xl border border-zinc-800">
            <h1 className="text-3xl font-extrabold mb-6 text-center text-zinc-100 tracking-tight">
                YouTube QnA Bot
            </h1>

            {thumbnail && (
                <div className="mb-6 flex justify-center">
                    <img
                        src={thumbnail}
                        alt="Video thumbnail"
                        className="rounded-lg shadow-md max-w-full h-auto"
                    />
                </div>
            )}

            {isPreprocessing ? (
                <div className="text-center mt-6">
                    <div className="flex justify-center items-center gap-2 text-zinc-200 font-semibold text-lg">
                        <svg
                            className="animate-spin h-5 w-5 text-zinc-200"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8z"
                            ></path>
                        </svg>
                        Analyzing video...
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
                    <input
                        type="text"
                        placeholder="Paste YouTube video URL"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full p-3 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 transition"
                        required
                        disabled={loading}
                    />
                    <input
                        type="text"
                        placeholder="Ask your question..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        className="w-full p-3 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 transition"
                        required
                        disabled={loading || !thumbnail}
                    />
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-800 to-blue-400 text-zinc-100 p-3 rounded-xl font-semibold shadow hover:from-blue-600 hover:to-zinc-500 transition disabled:opacity-60"
                        disabled={loading || isPreprocessing || !thumbnail}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg
                                    className="animate-spin h-5 w-5 text-zinc-100"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v8z"
                                    ></path>
                                </svg>
                                Thinking...
                            </span>
                        ) : (
                            "Get Answer"
                        )}
                    </button>
                </form>
            )}

            {answer && (
                <div className="mt-6 p-4 bg-zinc-800 text-zinc-100 rounded-xl border border-zinc-700 shadow">
                    <strong className="block mb-1">Answer:</strong>
                    <div className="whitespace-pre-line">
                        <ReactMarkdown>{answer}</ReactMarkdown>
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-6 p-4 bg-zinc-800 text-red-400 rounded-xl border border-red-400 shadow">
                    <strong className="block mb-1">Error:</strong>
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
};

export default VideoForm;
