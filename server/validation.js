// sync with same variables in the client code: UserAccount.cs
const passwordMinLength = 8;
const passwordMaxLength = 32;
const usernameMinLength = 5;
const usernameMaxLength = 16;


function passwordIsValid(input) {
    input = input.trim();

    if (input.length > passwordMaxLength) {
        return false;
    }

    if (input.length < passwordMinLength) {
        return false;
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(input)) {
        return false;
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(input)) {
        return false;
    }

    // Check for at least one digit (number)
    if (!/\d/.test(input)) {
        return false;
    }

    // Check that there are no characters outside the specified ranges
    if (/[^A-Za-z\d!@#$%^&*()_+\-=]/.test(input)) {
        return false;
    }

    // All checks passed, the string is valid
    return true;
}

function usernameIsValid(username) {
    if (!username || username.trim() === '') {
        return false;
    }

    if (username.length > usernameMaxLength) {
        return false;
    }

    if (username.length < usernameMinLength) {
        return false;
    }

    // ensure only letters and numbers are in the username
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
        return false;
    }

    // If all checks pass, the username is valid
    return true;
}

function emailIsValid(email) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z_]{2,}$/.test(email);
}

module.exports = {
    passwordIsValid, usernameIsValid, emailIsValid 
  };