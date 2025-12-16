// ==================== 好友功能模組 ====================

// 獲取 DOM 元素
let addFriendBtn, addFriendModal, addFriendForm, addFriendClose, addFriendCancel;
let addFriendMessage, searchUserBtn, searchUsername, searchResults, searchResultsList;
let friendsList, friendsEmpty, invitationsList, invitationsEmpty;
let Storage, state;

// 初始化 DOM 元素（在導入時調用）
function initializeDOMElements() {
  console.log('🔍 初始化 DOM 元素...');
  
  addFriendBtn = document.querySelector('#add-friend-btn');
  addFriendModal = document.querySelector('#add-friend-modal');
  addFriendForm = document.querySelector('#add-friend-form');
  addFriendClose = document.querySelector('#add-friend-close');
  addFriendCancel = document.querySelector('#add-friend-cancel');
  addFriendMessage = document.querySelector('#add-friend-message');
  searchUserBtn = document.querySelector('#search-user-btn');
  searchUsername = document.querySelector('#search-username');
  searchResults = document.querySelector('#search-results');
  searchResultsList = document.querySelector('#search-results-list');
  friendsList = document.querySelector('#friends-list');
  friendsEmpty = document.querySelector('#friends-empty');
  invitationsList = document.querySelector('#invitations-list');
  invitationsEmpty = document.querySelector('#invitations-empty');
  
  console.log('✅ DOM 元素已初始化');
  console.log('  - addFriendBtn:', addFriendBtn);
  console.log('  - addFriendModal:', addFriendModal);
  console.log('  - friendsList:', friendsList);
  console.log('  - invitationsList:', invitationsList);
  console.log('  - invitationsEmpty:', invitationsEmpty);
}

// API 調用
const friendsAPI = {
  sendRequest: async (toUserId) => {
    const response = await fetch('/api/friends/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Storage.getAuthToken()}`
      },
      body: JSON.stringify({ toUserId })
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  getRequests: async () => {
    const response = await fetch('/api/friends/requests', {
      headers: { 'Authorization': `Bearer ${Storage.getAuthToken()}` }
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  acceptRequest: async (requestId) => {
    const response = await fetch(`/api/friends/requests/${requestId}/accept`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${Storage.getAuthToken()}` }
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  rejectRequest: async (requestId) => {
    const response = await fetch(`/api/friends/requests/${requestId}/reject`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${Storage.getAuthToken()}` }
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  getFriendsList: async () => {
    const response = await fetch('/api/friends', {
      headers: { 'Authorization': `Bearer ${Storage.getAuthToken()}` }
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  removeFriend: async (friendId) => {
    const response = await fetch(`/api/friends/${friendId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${Storage.getAuthToken()}` }
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  blockUser: async (blockedUserId) => {
    const response = await fetch('/api/blacklist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Storage.getAuthToken()}`
      },
      body: JSON.stringify({ blockedUserId })
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  unblockUser: async (blockedUserId) => {
    const response = await fetch(`/api/blacklist/${blockedUserId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${Storage.getAuthToken()}` }
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  getBlacklist: async () => {
    const response = await fetch('/api/blacklist', {
      headers: { 'Authorization': `Bearer ${Storage.getAuthToken()}` }
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }
};

// 顯示/隱藏模態框
function showAddFriendModal() {
  console.log('🎯 顯示新增好友模態框');
  console.log('addFriendModal:', addFriendModal);
  console.log('addFriendModal.hidden:', addFriendModal?.hidden);
  
  if (!addFriendModal) {
    console.error('❌ 模態框不存在!');
    return;
  }
  
  addFriendModal.hidden = false;
  searchUsername.value = '';
  searchResults.hidden = true;
  addFriendMessage.textContent = '';
  
  console.log('✅ 模態框已顯示, hidden=' + addFriendModal.hidden);
}

function hideAddFriendModal() {
  addFriendModal.hidden = true;
}

// 搜尋用戶
async function handleSearchUser(e) {
  e.preventDefault();
  const username = searchUsername.value.trim();

  if (!username) {
    addFriendMessage.textContent = '請輸入使用者名稱';
    return;
  }

  try {
    addFriendMessage.textContent = '搜尋中...';
    
    // 搜尋用戶 - 暫時透過讀取所有好友請求來檢查是否存在
    // TODO: 實現專門的搜尋用戶端點
    const response = await fetch(`/api/activities/public`, {
      headers: { 'Authorization': `Bearer ${Storage.getAuthToken()}` }
    });
    
    const data = await response.json();
    const users = new Map();
    
    // 從公開活動中提取使用者
    data.data?.forEach(activity => {
      if (activity.ownerName && activity.ownerId && 
          !users.has(activity.ownerId) && 
          activity.ownerId !== state.user.id) {
        users.set(activity.ownerId, {
          userId: activity.ownerId,
          username: activity.ownerId,
          displayName: activity.ownerName
        });
      }
    });

    // 過濾搜尋結果
    const results = Array.from(users.values()).filter(u => 
      u.displayName.toLowerCase().includes(username.toLowerCase()) ||
      u.userId.toLowerCase().includes(username.toLowerCase())
    );

    if (results.length === 0) {
      addFriendMessage.textContent = '找不到此使用者';
      searchResults.hidden = true;
      return;
    }

    // 顯示搜尋結果
    searchResultsList.innerHTML = '';
    results.forEach(user => {
      const li = document.createElement('li');
      li.className = 'search-result-item';
      li.innerHTML = `
        <div class="search-result-info">
          <p class="search-result-name">${user.displayName}</p>
          <p class="search-result-username">@${user.userId}</p>
        </div>
        <button type="button" class="add-friend-action-btn" data-user-id="${user.userId}">新增</button>
      `;
      
      const addBtn = li.querySelector('.add-friend-action-btn');
      addBtn.addEventListener('click', () => handleSendFriendRequest(user.userId));
      
      searchResultsList.appendChild(li);
    });

    searchResults.hidden = false;
    addFriendMessage.textContent = '';
  } catch (err) {
    console.error('搜尋使用者錯誤:', err);
    addFriendMessage.textContent = '搜尋失敗，請稍後再試';
    addFriendMessage.classList.add('error');
  }
}

// 發送好友請求
async function handleSendFriendRequest(toUserId) {
  try {
    await friendsAPI.sendRequest(toUserId);
    addFriendMessage.textContent = '好友請求已發送！';
    addFriendMessage.classList.remove('error');
    
    // 清空搜尋
    setTimeout(() => {
      hideAddFriendModal();
    }, 1000);
  } catch (err) {
    console.error('發送好友請求錯誤:', err);
    addFriendMessage.textContent = err.message || '發送失敗，請稍後再試';
    addFriendMessage.classList.add('error');
  }
}

// 重新整理好友列表
async function refreshFriendsList() {
  if (!state.token) return;

  try {
    const result = await friendsAPI.getFriendsList();
    state.friends = result.data || [];
    renderFriendsList();
  } catch (err) {
    console.error('取得好友列表錯誤:', err);
  }
}

// 重新整理好友邀請
async function refreshFriendRequests() {
  if (!state.token) return;

  try {
    console.log('🔄 刷新好友邀請...');
    const result = await friendsAPI.getRequests();
    console.log('📨 好友邀請結果:', result);
    state.friendRequests = result.data || [];
    console.log('📨 state.friendRequests:', state.friendRequests);
    renderFriendRequests();
  } catch (err) {
    console.error('取得好友邀請錯誤:', err);
  }
}

// 顯示好友列表
function renderFriendsList() {
  if (!friendsList) return;

  friendsList.innerHTML = '';

  if (state.friends.length === 0) {
    friendsEmpty.hidden = false;
    return;
  }

  friendsEmpty.hidden = true;

  state.friends.forEach(friend => {
    const li = document.createElement('li');
    li.className = 'friend-item';
    li.innerHTML = `
      <div class="friend-info">
        <p class="friend-name">${friend.displayName}</p>
        <p class="friend-username">@${friend.username}</p>
      </div>
      <div class="friend-actions">
        <button type="button" class="friend-action-btn remove-friend-btn" data-friend-id="${friend.userId}" title="移除好友">❌</button>
        <button type="button" class="friend-action-btn block-user-btn" data-user-id="${friend.userId}" title="黑名單">🚫</button>
      </div>
    `;

    const removeBtn = li.querySelector('.remove-friend-btn');
    const blockBtn = li.querySelector('.block-user-btn');

    removeBtn.addEventListener('click', () => handleRemoveFriend(friend.userId));
    blockBtn.addEventListener('click', () => handleBlockUser(friend.userId));

    friendsList.appendChild(li);
  });
}

// 顯示好友邀請
function renderFriendRequests() {
  console.log('🎨 渲染好友邀請...');
  console.log('invitationsList:', invitationsList);
  console.log('invitationsEmpty:', invitationsEmpty);
  
  if (!invitationsList) {
    console.error('❌ invitationsList 未找到!');
    return;
  }

  invitationsList.innerHTML = '';

  if (state.friendRequests.length === 0) {
    console.log('📭 沒有好友邀請');
    invitationsEmpty.hidden = false;
    return;
  }

  console.log('📬 顯示 ' + state.friendRequests.length + ' 個邀請');
  invitationsEmpty.hidden = true;

  state.friendRequests.forEach(request => {
    const li = document.createElement('li');
    li.className = 'invitation-item';
    li.innerHTML = `
      <div class="invitation-info">
        <p class="invitation-name">${request.displayName}</p>
        <p class="invitation-username">@${request.username}</p>
        <p class="invitation-time">${new Date(request.createdAt).toLocaleDateString('zh-TW')}</p>
      </div>
      <div class="invitation-actions">
        <button type="button" class="accept-request-btn" data-request-id="${request.requestId}">接受</button>
        <button type="button" class="reject-request-btn" data-request-id="${request.requestId}">拒絕</button>
      </div>
    `;

    const acceptBtn = li.querySelector('.accept-request-btn');
    const rejectBtn = li.querySelector('.reject-request-btn');

    acceptBtn.addEventListener('click', () => handleAcceptRequest(request.requestId));
    rejectBtn.addEventListener('click', () => handleRejectRequest(request.requestId));

    invitationsList.appendChild(li);
  });
}

// 接受好友邀請
async function handleAcceptRequest(requestId) {
  try {
    await friendsAPI.acceptRequest(requestId);
    await Promise.all([refreshFriendRequests(), refreshFriendsList()]);
  } catch (err) {
    console.error('接受好友邀請錯誤:', err);
    alert('接受失敗，請稍後再試');
  }
}

// 拒絕好友邀請
async function handleRejectRequest(requestId) {
  try {
    await friendsAPI.rejectRequest(requestId);
    await refreshFriendRequests();
  } catch (err) {
    console.error('拒絕好友邀請錯誤:', err);
    alert('拒絕失敗，請稍後再試');
  }
}

// 移除好友
async function handleRemoveFriend(friendId) {
  if (!confirm('確定要移除此好友嗎？')) return;

  try {
    await friendsAPI.removeFriend(friendId);
    await refreshFriendsList();
  } catch (err) {
    console.error('移除好友錯誤:', err);
    alert('移除失敗，請稍後再試');
  }
}

// 黑名單用戶
async function handleBlockUser(userId) {
  if (!confirm('確定要將此用戶加入黑名單嗎？')) return;

  try {
    await friendsAPI.blockUser(userId);
    await Promise.all([refreshFriendsList(), refreshFriendRequests()]);
    alert('已將此用戶加入黑名單');
  } catch (err) {
    console.error('黑名單錯誤:', err);
    alert('操作失敗，請稍後再試');
  }
}

// 初始化好友功能
function initFriends() {
  console.log('🔍 初始化好友功能...');
  
  // 從全局獲取 Storage 和 state
  if (typeof window !== 'undefined' && window.Storage) {
    Storage = window.Storage;
  }
  if (typeof window !== 'undefined' && window.state) {
    state = window.state;
  }
  
  console.log('addFriendBtn:', addFriendBtn);
  console.log('addFriendModal:', addFriendModal);
  console.log('addFriendForm:', addFriendForm);
  
  if (!addFriendBtn) {
    console.warn('⚠️ addFriendBtn 未找到，跳過初始化');
    return;
  }

  addFriendBtn.addEventListener('click', showAddFriendModal);
  addFriendClose.addEventListener('click', hideAddFriendModal);
  addFriendCancel.addEventListener('click', hideAddFriendModal);
  addFriendForm.addEventListener('submit', handleSearchUser);

  console.log('✅ 好友功能初始化完成');

  // 設置初始狀態 - 確保 invitations-empty 在開始時顯示
  if (invitationsEmpty) {
    invitationsEmpty.hidden = false;
  }
  if (invitationsList) {
    invitationsList.innerHTML = '';
  }

  // 初始加載
  refreshFriendsList();
  refreshFriendRequests();

  // 定期刷新好友邀請
  setInterval(refreshFriendRequests, 30000); // 每30秒刷新一次
}

// 匯出函數
export {
  initFriends,
  initializeDOMElements,
  refreshFriendsList,
  refreshFriendRequests,
  renderFriendsList,
  renderFriendRequests,
  friendsAPI
};
