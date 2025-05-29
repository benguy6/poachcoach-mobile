const { supabase } = require('./supabaseClient');

const delete_unverified_users = async () => {
    const now = new Date()

    let x = await supabase.auth.admin.listUsers()
    let y = x.data?.users || []

    for (let i = 0; i < y.length; i++) {
        if ((now - new Date(y[i].created_at))/36e5 >= 24 && y[i].email_confirmed_at===null) {
            console.log('deleting unverified user')
            await supabase.auth.admin.deleteUser(y[i].id)
        }
    }
    
    
}

delete_unverified_users()