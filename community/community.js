// community.js (type="module" 필요!)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, updateDoc, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Firebase 설정 (본인 값으로 교체)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 데모용 사용자 정보 (실제 서비스는 Firebase Auth 사용 권장)
const currentUser = {
  uid: "testuser123",
  nickname: "테스트유저"
};

// DOM 요소
const postList = document.getElementById('postList');
const writeBtn = document.getElementById('writeBtn');
const writeModal = document.getElementById('writeModal');
const cancelWrite = document.getElementById('cancelWrite');
const submitWrite = document.getElementById('submitWrite');
const postTitle = document.getElementById('postTitle');
const postContent = document.getElementById('postContent');

const editModal = document.getElementById('editModal');
const editTitle = document.getElementById('editTitle');
const editContent = document.getElementById('editContent');
const cancelEdit = document.getElementById('cancelEdit');
const submitEdit = document.getElementById('submitEdit');

let editingPostId = null;

// 모달 열기/닫기
writeBtn.onclick = () => writeModal.classList.remove('hidden');
cancelWrite.onclick = () => writeModal.classList.add('hidden');
cancelEdit.onclick = () => editModal.classList.add('hidden');

// 글 등록
submitWrite.onclick = async () => {
  const title = postTitle.value.trim();
  const content = postContent.value.trim();
  if (!title || !content) return alert('제목과 내용을 모두 입력하세요.');
  await addDoc(collection(db, "posts"), {
    title,
    content,
    uid: currentUser.uid,
    nickname: currentUser.nickname,
    createdAt: serverTimestamp()
  });
  postTitle.value = "";
  postContent.value = "";
  writeModal.classList.add('hidden');
};

// 실시간 게시글 목록
const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
  postList.innerHTML = "";
  snapshot.forEach(docSnap => {
    const post = docSnap.data();
    const id = docSnap.id;
    const div = document.createElement('div');
    div.className = "bg-gray-800 p-4 rounded relative";
    div.innerHTML = `
      <h3 class="font-bold text-lg">${post.title}</h3>
      <p class="text-gray-300 break-words">${post.content}</p>
      <div class="text-gray-500 text-sm mt-2">작성자: ${post.nickname}</div>
      <div class="absolute top-3 right-3 flex gap-2">
        ${post.uid === currentUser.uid ? `
          <button class="editBtn bg-blue-600 text-white px-2 py-1 rounded text-xs" data-id="${id}">수정</button>
          <button class="deleteBtn bg-red-600 text-white px-2 py-1 rounded text-xs" data-id="${id}">삭제</button>
        ` : ""}
      </div>
    `;
    postList.appendChild(div);
  });

  // 수정 버튼 이벤트
  document.querySelectorAll('.editBtn').forEach(btn => {
    btn.onclick = (e) => {
      editingPostId = btn.dataset.id;
      // 해당 게시글 정보 가져오기
      const postDoc = snapshot.docs.find(d => d.id === editingPostId);
      editTitle.value = postDoc.data().title;
      editContent.value = postDoc.data().content;
      editModal.classList.remove('hidden');
    };
  });

  // 삭제 버튼 이벤트
  document.querySelectorAll('.deleteBtn').forEach(btn => {
    btn.onclick = async (e) => {
      const ok = confirm("정말 삭제하시겠습니까?");
      if (ok) {
        await deleteDoc(doc(db, "posts", btn.dataset.id));
      }
    };
  });
});

// 글 수정
submitEdit.onclick = async () => {
  const title = editTitle.value.trim();
  const content = editContent.value.trim();
  if (!title || !content) return alert('제목과 내용을 모두 입력하세요.');
  if (!editingPostId) return;
  await updateDoc(doc(db, "posts", editingPostId), {
    title,
    content
  });
  editingPostId = null;
  editModal.classList.add('hidden');
};