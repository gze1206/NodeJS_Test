console.log("userform.js");
if(document.querySelector("#create_user")){
  document.querySelector("#create_user input[type='button']").onclick = function(e){
    var isValid = true;
    var regex=/^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/;
    document.querySelector("#email_error").innerText = "";
    document.querySelector("#nickname_error").innerText = "";
    document.querySelector("#password_error").innerText = "";
    if(document.querySelector("#email").value === "" || regex.test(document.querySelector("#email").value) === false ){
      isValid = false;
      document.querySelector("#email_error").innerText = "- 올바른 메일 주소를 입력해 주세요.";
    }
    if(document.querySelector("#nickname").value === ""){
      isValid = false;
      document.querySelector("#nickname_error").innerText = "- 닉네임을 입력해 주세요.";
    }
    if(document.querySelector("#password").value === ""){
      isValid = false;
      document.querySelector("#password_error").innerText = "- 비밀번호를 입력해 주세요.";
    }
    if(document.querySelector("#password").value !== document.querySelector("#password_confirmation").value){
      isValid = false;
      document.querySelector("#password_confirmation_error").innerText = "- 비밀번호와 재입력한 비밀번호가 일치하지 않습니다.";
    }
    if(isValid){
      document.querySelector("#create_user").submit();
    }
  };
}
if(document.querySelector("#update_user")){
  document.querySelector("#update_user input[type='button']").onclick = function(e){
    var isValid = true;
    document.querySelector("#email_error").innerText = "";
    document.querySelector("#nickname_error").innerText = "";
    document.querySelector("#password_error").innerText = "";
    var regex=/^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/;
    if(document.querySelector("#email").value === "" || regex.test(document.querySelector("#email").value) === false){
      isValid = false;
      document.querySelector("#email_error").innerText = "- 올바른 메일주소를 입력해 주세요.";
    }
    if(document.querySelector("#nickname").value === ""){
      isValid = false;
      document.querySelector("#nickname_error").innerText = "- 닉네임을 입력해 주세요.";
    }
    if(document.querySelector("#password").value === ""){
      isValid = false;
      document.querySelector("#password_error").innerText = "- 비밀번호를 입력해 주세요.";
    }
    if(document.querySelector("#new_password").value !== document.querySelector("#password_confirmation").value){
      isValid = false;
      document.querySelector("#password_confirmation_error").innerText = "- 새로운 비밀번호와 재입력한 비밀번호가 일치하지 않습니다.";
    }
    if(isValid){
      document.querySelector("#update_user").submit();
    }
  };
}
