# 배포 설정 가이드

## 1단계 — Firebase 프로젝트 생성

1. https://console.firebase.google.com 접속
2. **프로젝트 만들기** → 이름 입력 (예: `curriculum-backward`)
3. Google 애널리틱스: 선택 사항

### Firebase Authentication 설정
- 콘솔 좌측 **Authentication** → **시작하기**
- **Sign-in method** → **Google** → 사용 설정 → 저장

### Firestore 설정
- 콘솔 좌측 **Firestore Database** → **데이터베이스 만들기**
- **프로덕션 모드**로 시작
- 리전: `asia-northeast3` (서울)

### Firestore 보안 규칙 설정
Firestore → **규칙** 탭 → 아래 내용으로 교체 후 게시:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /designs/{docId} {
      // 본인 문서만 읽기·쓰기·삭제
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
      // 공유된 문서는 누구나 읽기 가능
      allow read: if resource.data.shared == true;
    }
  }
}
```

### Firebase 앱 등록 및 설정값 복사
- 콘솔 **프로젝트 설정** (⚙️) → **내 앱** → **웹 앱 추가** (</> 아이콘)
- 앱 닉네임 입력 후 **앱 등록**
- 아래 firebaseConfig 값을 복사

### public/index.html 수정
`public/index.html` 안의 Firebase 설정 부분을 실제 값으로 교체:

```js
const firebaseConfig = {
  apiKey:            "여기에_복사한_값",
  authDomain:        "여기에_복사한_값",
  projectId:         "여기에_복사한_값",
  storageBucket:     "여기에_복사한_값",
  messagingSenderId: "여기에_복사한_값",
  appId:             "여기에_복사한_값"
};
```

---

## 2단계 — Vercel 배포

### 사전 준비
```bash
npm install -g vercel
vercel login   # Vercel 계정으로 로그인
```

### 환경변수 설정 (중요!)
```bash
vercel env add ANTHROPIC_API_KEY
# 입력: sk-ant-api03-...  (실제 Claude API 키)
# 환경: Production, Preview, Development 모두 선택
```

### 배포
```bash
cd /Users/2030hyutagojigyosil/Desktop/backward/project
vercel --prod
```

배포 완료 후 출력되는 URL이 서비스 주소입니다.  
예: `https://curriculum-backward-xxxxx.vercel.app`

---

## 3단계 — Firebase 승인 도메인 추가

Firebase 콘솔 → **Authentication** → **Settings** → **승인된 도메인** → **도메인 추가**  
→ Vercel에서 받은 도메인 입력 (예: `curriculum-backward-xxxxx.vercel.app`)

---

## 로컬 개발

```bash
cd /Users/2030hyutagojigyosil/Desktop/backward/project
npm install
# .env.local 에 ANTHROPIC_API_KEY 입력
vercel dev   # http://localhost:3000
```

---

## 프로젝트 구조

```
project/
├── api/
│   └── claude.js          # Claude API 프록시 (Vercel Edge Function)
├── public/
│   └── index.html         # 메인 앱 (Firebase SDK 포함)
├── package.json
├── vercel.json            # 라우팅 설정
├── .env.local             # 로컬 환경변수 (git 제외)
└── .gitignore
```
