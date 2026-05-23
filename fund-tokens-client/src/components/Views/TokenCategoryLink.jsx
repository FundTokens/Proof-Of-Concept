import { tokenExplorerRoute } from "../../config";

function TokenCategoryLink({ categoryId, children }) {
    return <a href={tokenExplorerRoute + categoryId} target='_blank' rel='noopener noreferrer'>{children ?? 'Token Explorer'}</a>
}

export default TokenCategoryLink;