"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

/* ---------------- TYPES ---------------- */

type Community = {
  id: string;
  name: string;
  description: string;
};

type Theme = {
  id: string;
  title: string;
  description: string;
};

type Post = {
  id: string;
  title: string;
  content: string;
  themeId: string;
  themeTitle: string;
};

/* ---------------- PAGE ---------------- */

export default function CommunityDetailPage() {
  const { id } = useParams() as { id: string };

  const [community, setCommunity] = useState<Community | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const [activeTab, setActiveTab] = useState<"themes" | "posts">("themes");
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);// later we create a global modal and will remove this local modal and same for loading or loader,toast notification etc
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");

  const [showCustomForm, setShowCustomForm] = useState(false);// form for adding custom theme , later can be a modal or form only.
  const [customTheme, setCustomTheme] = useState({ title: "", description: "" });

  /* ---------------- LOAD DATA ---------------- */

  useEffect(() => {
    const communities = JSON.parse(localStorage.getItem("communities") || "[]");
    const found = communities.find((c: Community) => c.id === id);// c.id is community id and id is from url params, we are finding the community which matches the id from url and setting it to state, if not found we set it to null
    setCommunity(found || null);// this found contains the single ccmmunity that we selected in dashboard page.

    setThemes(JSON.parse(localStorage.getItem(`themes_${id}`) || "[]"));
    setPosts(JSON.parse(localStorage.getItem(`posts_${id}`) || "[]"));
  }, [id]);// this id is from url params, so whenever we change the url params this useEffect will run and load the data for that community, themes and posts are also loaded from local storage based on community id.

  /* ---------------- SAVE ---------------- */

  useEffect(() => {
    localStorage.setItem(`themes_${id}`, JSON.stringify(themes));// this id is from url params, so we are saving the themes for that particular community in local storage with key as themes_communityId and value as the themes array in string format, whenever themes state changes this useEffect will run and save the updated themes to local storage.
  }, [themes, id]);

  useEffect(() => {
    localStorage.setItem(`posts_${id}`, JSON.stringify(posts));// this id is from url params, so we are saving the posts for that particular community in local storage with key as posts_communityId and value as the posts array in string format, whenever posts state changes this useEffect will run and save the updated posts to local storage.
  }, [posts, id]);

  /* ---------------- GENERATORS ---------------- */

  const generateThemes = async () => {
    await new Promise((r) => setTimeout(r, 800));

    setThemes([// this arev dummy themes but later we will integrate with ai to generate themes based on community description or name or any other parameter, for now we are just adding some dummy themes to demonstrate the functionality.
      {
        id: crypto.randomUUID(),
        title: "Awareness Campaign",
        description: "Promote mission and values",
      },
      {
        id: crypto.randomUUID(),
        title: "Educational Content",
        description: "Share knowledge & insights",
      },
      {
        id: crypto.randomUUID(),
        title: "Events Promotion",
        description: "Boost engagement",
      },
    ]);
  };

  const generatePosts = async (theme: Theme) => {// passing theme as parameter because we need to generate posts based on selected theme, later we can also pass other parameters like community description or name or any other parameter to generate more relevant posts.
    await new Promise((r) => setTimeout(r, 600));

    const newPosts: Post[] = [// these are dummy posts but later we will integrate with ai to generate posts based on theme title or description or any other parameter, for now we are just adding some dummy posts to demonstrate the functionality.
      {
        id: crypto.randomUUID(),
        themeId: theme.id,
        themeTitle: theme.title,
        title: `${theme.title} Idea`,
        content: `Discover the power of ${theme.title}. Join today.`,
      },
      {
        id: crypto.randomUUID(),
        themeId: theme.id,
        themeTitle: theme.title,
        title: `${theme.title} Awareness`,
        content: `Learn how ${theme.title} can transform lives.`,
      },
    ];

    setPosts((prev) => [...newPosts, ...prev]);
  };

  /* ---------------- POST ACTIONS ---------------- */

  const deletePost = (postId: string) => {// postId is the id of the post that we want to delete, we are filtering out the post with the given id from the posts array and setting the updated array to state, this will remove the post from the UI and also from local storage because we have useEffect that saves the posts to local storage whenever posts state changes.
    setPosts((post) => post.filter((p) => p.id !== postId));
  };

  const polishPost = (postId: string) => {
    setPosts((post) =>
      post.map((p) =>
        p.id === postId ? { ...p, content: p.content + " ✨ Polished" } : p
      )
    );
  };

  const regeneratePost = async () => {
    if (!editingPostId) return;// this editingPostId is the id of the post that we want to edit, if it is null then we return and do nothing, this can happen if user clicks on generate button without selecting any post or if there is some error in setting the editingPostId state, so we are just adding a safety check here.

    await new Promise((r) => setTimeout(r, 600));

    setPosts((post) =>
      post.map((p) =>
        p.id === editingPostId
          ? { ...p, content: p.content + " → " + editPrompt }// in content field the ai generated content will come , our task is to take the existing content and take the edit prompt from user and send to ai and then generate new content.
          : p
      )
    );

    setShowEditModal(false);
    setEditPrompt("");
    setEditingPostId(null);
  };

  /* ---------------- CUSTOM THEME ---------------- */

  const addCustomTheme = () => {
    if (!customTheme.title.trim()) return;// this is a safety check to ensure that the title of the custom theme is not empty, if it is empty then we return and do nothing, this will prevent adding themes with empty titles to the themes array and also to local storage.

    setThemes((theme) => [
      ...theme,
      {
        id: crypto.randomUUID(),
        title: customTheme.title,
        description: customTheme.description || "Custom theme",
      },
    ]);

    setCustomTheme({ title: "", description: "" });
    setShowCustomForm(false);
  };

  /* ---------------- SAFETY ---------------- */

  if (!community)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1120] text-white">
        Community not found
      </div>
    );

  /* ================================================= */

  return (
    <div className="bg-[#0B1120] min-h-screen px-4 sm:px-6 py-10">

      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 mb-8">
          <h1 className="text-xl text-white font-semibold">{community.name}</h1>
          <p className="text-gray-400 mt-2 text-sm">{community.description}</p>
        </div>

        {/* TABS */}
        <div className="border-b border-gray-800 flex gap-6 mb-8">
          {["themes", "posts"].map((tab) => (// we have two tabs themes and posts, we are mapping through them to create the tab buttons, when user clicks on a tab button we set the activeTab state to that tab, and we also add some styling to indicate which tab is active, if the activeTab is equal to the current tab then we add a blue color and border at the bottom, otherwise we add a gray color to indicate that it is not active.
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-3 ${
                activeTab === tab
                  ? "text-blue-500 border-b-2 border-blue-500"
                  : "text-gray-400"
              }`}
            >
              {tab === "themes" ? "Themes" : "Your Posts"}
            </button>
          ))}
        </div>

        {/* THEMES TAB */}
        {activeTab === "themes" && (// if the active tab is themes then we show the themes related content, if active tab is posts then we show the posts related content, this is a simple conditional rendering based on the activeTab state.
          <>
            {selectedTheme ? (
              <div>

                <button
                  onClick={() => setSelectedTheme(null)}
                  className="mb-6 text-blue-400 text-sm"
                >
                  ← Back to Themes
                </button>

                <h2 className="text-lg text-white font-semibold mb-6">
                  {selectedTheme.title}
                </h2>

                <button
                  onClick={() => generatePosts(selectedTheme)}
                  className="mb-8 bg-blue-600 px-6 py-3 rounded-lg text-white"
                >
                  Generate Posts
                </button>

                {/* POSTS OF THEME */}
                <div className="grid md:grid-cols-2 gap-6">
                  {posts
                    .filter((post) => post.themeId === selectedTheme.id)
                    .map((post) => (
                      <div
                        key={post.id}
                        className="bg-[#111827] border border-gray-800 rounded-xl p-5 space-y-3"
                      >
                        <span className="text-xs text-blue-400">
                          {post.themeTitle}
                        </span>

                        <h3 className="text-white font-semibold">
                          {post.title}
                        </h3>

                        <p className="text-gray-400 text-sm">
                          {post.content}
                        </p>

                        <div className="flex gap-4 text-sm flex-wrap">
                          <button
                            onClick={() => {
                              setEditingPostId(post.id);
                              setShowEditModal(true);
                            }}
                            className="text-blue-400"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => deletePost(post.id)}
                            className="text-red-400"
                          >
                            Delete
                          </button>

                          <button
                            onClick={() => polishPost(post.id)}
                            className="text-purple-400"
                          >
                            Polish
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : themes.length === 0 ? (
              <div className="bg-[#111827] rounded-xl p-12 text-center border border-gray-800">
                <button
                  onClick={generateThemes}
                  className="bg-blue-600 px-6 py-3 rounded-lg text-white"
                >
                  Generate Themes
                </button>
              </div>
            ) : (
              <div className="space-y-6">

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowCustomForm(!showCustomForm)}
                    className="bg-gray-700 px-5 py-2 rounded-lg text-white text-sm"
                  >
                    + Add Custom Theme
                  </button>
                </div>

                {showCustomForm && (
                  <div className="bg-[#111827] border border-gray-700 rounded-xl p-6 space-y-4">
                    <input
                      placeholder="Title"
                      value={customTheme.title}
                      onChange={(e) =>
                        setCustomTheme({
                          ...customTheme,
                          title: e.target.value,
                        })
                      }
                      className="w-full bg-[#0F172A] px-4 py-3 rounded text-white"
                    />

                    <textarea
                      placeholder="Description"
                      value={customTheme.description}
                      onChange={(e) =>
                        setCustomTheme({
                          ...customTheme,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-[#0F172A] px-4 py-3 rounded text-white"
                    />

                    <button
                      onClick={addCustomTheme}
                      className="bg-blue-600 px-6 py-2 rounded text-white"
                    >
                      Add Theme
                    </button>
                  </div>
                )}

                {themes.map((theme) => (
                  <div
                    key={theme.id}
                    className="bg-[#111827] border border-gray-800 rounded-xl p-5 flex flex-col md:flex-row md:justify-between gap-4"
                  >
                    <div>
                      <h3 className="text-white font-semibold">
                        {theme.title}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {theme.description}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedTheme(theme)}
                      className="bg-blue-600 px-4 py-2 rounded text-white text-sm"
                    >
                      View Posts
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* POSTS TAB */}
        {activeTab === "posts" && (
          <div className="grid md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-[#111827] border border-gray-800 rounded-xl p-5 space-y-3"
              >
                <span className="text-xs text-blue-400">
                  {post.themeTitle}
                </span>
                <h3 className="text-white font-semibold">{post.title}</h3>
                <p className="text-gray-400 text-sm">{post.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EDIT MODAL */}// this is the modal that will show when user clicks on edit button for a post, in this modal user can enter the edit prompt and when they click on generate button we will take the existing content of the post and the edit prompt and send it to ai to generate new content and then update the post with the new content, for now we are just appending the edit prompt to the existing content to demonstrate the functionality.
      {showEditModal && (// we can replace this modal trhough a global modal later.
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#111827] w-full max-w-lg rounded-xl p-6 space-y-4 border border-gray-700">
            <h3 className="text-white text-lg font-semibold">
              Edit Post with AI
            </h3>

            <textarea
              placeholder="Describe changes..."
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              className="w-full bg-[#020617] border border-gray-700 rounded-lg p-3 text-white"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-700 rounded text-white"
              >
                Cancel
              </button>

              <button
                onClick={regeneratePost}
                className="px-5 py-2 bg-blue-600 rounded text-white"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

