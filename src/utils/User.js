class User {
    constructor(accessToken, tokenExpirationDate, role) {
        this.accessToken = accessToken;
        this.tokenExpirationDate = tokenExpirationDate;
        this.role = role;
    }

    isExpired() {
        return new Date() > this.tokenExpirationDate;
    }

    isAdmin() {
        return isAdminRole(this.role);
    }
}

export function isAdminRole(role) {
    return role !== 0;
}

export default User;